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
  const lastScannedRef = useRef({ code: '', time: 0 });
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(true);
  const [lastScanned, setLastScanned] = useState('');

  // Unique container ID so re-mounts never share DOM nodes
  const containerIdRef = useRef(`barcode-reader-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    let isMounted = true;
    let isStarting = true;
    const regionId = containerIdRef.current;

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

    const startScanner = async () => {
      try {
        // Pre-clear any residual DOM elements
        const containerEl = document.getElementById(regionId);
        if (containerEl) {
          containerEl.innerHTML = '';
        }

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
            // Prevent duplicate rapid fires for the same barcode within 1.5s
            if (
              lastScannedRef.current.code === decodedText &&
              now - lastScannedRef.current.time < 1500
            ) {
              return;
            }
            lastScannedRef.current = { code: decodedText, time: now };
            setLastScanned(decodedText);

            // Play a subtle beep sound using Web Audio API
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
            } catch {
              // Ignore audio context errors
            }

            onScan(decodedText);

            if (!continuous) {
              stopAndClose();
            }
          },
          () => {
            // Frame scan loop - normal when no barcode detected in frame
          }
        );

        isStarting = false;
        if (isMounted) {
          setStarting(false);
          // Hide any canvas that html5-qrcode might append inside container
          if (containerEl) {
            const canvases = containerEl.querySelectorAll('canvas');
            canvases.forEach((c) => {
              c.style.display = 'none';
              c.style.visibility = 'hidden';
            });
          }
        } else {
          // If unmounted while start was resolving, stop immediately
          if (html5QrCode.isScanning) {
            html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {});
          } else {
            html5QrCode.clear();
          }
        }
      } catch (err) {
        isStarting = false;
        if (isMounted) {
          setStarting(false);
          setError(
            err?.message ||
              'Camera access denied or no camera found. Please allow camera permission in your browser.'
          );
        }
      }
    };

    const stopAndClose = async () => {
      try {
        if (html5QrCode.isScanning) {
          await html5QrCode.stop();
        }
        html5QrCode.clear();
      } catch {
        // Ignore stop errors
      }
      if (isMounted) onClose();
    };

    startScanner();

    return () => {
      isMounted = false;
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
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [continuous, onClose, onScan]);

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
            <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-700 min-h-[240px] max-h-[300px] flex items-center justify-center">
              {starting && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 text-xs text-slate-300 gap-2">
                  <Camera className="w-6 h-6 text-emerald-400 animate-pulse" />
                  <span>Starting camera...</span>
                </div>
              )}
              {/* Dynamic unique container ID */}
              <div id={containerIdRef.current} className="w-full h-full overflow-hidden" />
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
