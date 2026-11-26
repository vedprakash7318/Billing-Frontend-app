import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, AlertCircle, ScanBarcode } from 'lucide-react';

export default function BarcodeScanner({
  onScan,
  onClose,
  title = 'Scan Product Barcode',
  subtitle = 'Point camera at barcode or QR code',
  continuous = false,
}) {
  const scannerRef = useRef(null);
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);
  const lastScannedRef = useRef({ code: '', time: 0 });
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(true);
  const [lastScanned, setLastScanned] = useState('');

  // Keep latest callbacks without triggering re-runs
  useEffect(() => {
    onScanRef.current = onScan;
    onCloseRef.current = onClose;
  });

  // Unique container ID so re-mounts never share DOM nodes
  const containerIdRef = useRef(`barcode-reader-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    let isMounted = true;
    const regionId = containerIdRef.current;

    // Helper to stop and purge existing video tracks in the container
    const cleanupMedia = () => {
      const containerEl = document.getElementById(regionId);
      if (containerEl) {
        const videos = containerEl.querySelectorAll('video');
        videos.forEach((v) => {
          try {
            if (v.srcObject && v.srcObject.getTracks) {
              v.srcObject.getTracks().forEach((track) => track.stop());
            }
            v.srcObject = null;
          } catch {}
          v.remove();
        });
        const canvases = containerEl.querySelectorAll('canvas');
        canvases.forEach((c) => c.remove());
      }
    };

    cleanupMedia();

    const html5QrCode = new Html5Qrcode(regionId, {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.CODE_93,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.QR_CODE,
      ],
      verbose: false,
    });
    scannerRef.current = html5QrCode;

    const stopAndClose = async () => {
      try {
        if (html5QrCode.isScanning) {
          await html5QrCode.stop();
        }
        html5QrCode.clear();
      } catch {}
      cleanupMedia();
      if (isMounted && onCloseRef.current) onCloseRef.current();
    };

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 250, height: 160 },
            aspectRatio: 1.3333,
          },
          (decodedText) => {
            if (!isMounted) return;
            const now = Date.now();
            if (
              lastScannedRef.current.code === decodedText &&
              now - lastScannedRef.current.time < 1500
            ) {
              return;
            }
            lastScannedRef.current = { code: decodedText, time: now };
            setLastScanned(decodedText);

            // Audio beep feedback
            try {
              const ctx = new (window.AudioContext || window.webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(1000, ctx.currentTime);
              gain.gain.setValueAtTime(0.1, ctx.currentTime);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.1);
            } catch {}

            if (onScanRef.current) onScanRef.current(decodedText);

            if (!continuous) {
              stopAndClose();
            }
          },
          () => {}
        );

        if (!isMounted) {
          if (html5QrCode.isScanning) {
            html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {});
          } else {
            html5QrCode.clear();
          }
          cleanupMedia();
          return;
        }

        setStarting(false);

        // Enforce single video tag: remove duplicate video/canvas elements
        const containerEl = document.getElementById(regionId);
        if (containerEl) {
          const videos = containerEl.querySelectorAll('video');
          if (videos.length > 1) {
            for (let i = 1; i < videos.length; i++) {
              try {
                if (videos[i].srcObject && videos[i].srcObject.getTracks) {
                  videos[i].srcObject.getTracks().forEach((t) => t.stop());
                }
              } catch {}
              videos[i].remove();
            }
          }
          const canvases = containerEl.querySelectorAll('canvas');
          canvases.forEach((c) => {
            c.style.display = 'none';
            c.remove();
          });
        }
      } catch (err) {
        if (isMounted) {
          setStarting(false);
          setError(
            err?.message ||
              'Camera access denied or no camera found. Please allow camera permission in your browser.'
          );
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      cleanupMedia();
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current
              .stop()
              .then(() => scannerRef.current.clear())
              .catch(() => {});
          } else {
            scannerRef.current.clear();
          }
        } catch {}
      }
    };
  }, [continuous]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 text-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-800">
        {/* Header */}
        <div className="px-4 py-3.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ScanBarcode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">{title}</h3>
              <p className="text-[10px] text-slate-400">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="p-4 space-y-3">
          {error ? (
            <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center space-y-2.5">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <p className="text-xs font-bold text-rose-200">Camera Unavailable</p>
              <p className="text-[11px] text-rose-300/90 leading-relaxed">{error}</p>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-700 min-h-[240px] max-h-[280px] flex items-center justify-center">
              {starting && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 text-xs text-slate-300 gap-2">
                  <Camera className="w-6 h-6 text-emerald-400 animate-pulse" />
                  <span>Starting camera...</span>
                </div>
              )}
              {/* Unique scanner container */}
              <div id={containerIdRef.current} className="w-full h-full min-h-[240px] relative overflow-hidden" />
            </div>
          )}

          {lastScanned && (
            <div className="px-3 py-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-center text-xs">
              <span className="text-emerald-300">Last Scanned: </span>
              <span className="font-mono font-bold text-white">{lastScanned}</span>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors"
          >
            {continuous ? 'Done Scanning' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
