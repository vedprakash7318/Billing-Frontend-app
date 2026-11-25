import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#0f172a',
  color: '#ffffff',
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  },
  customClass: {
    popup: 'rounded-2xl shadow-2xl border border-slate-800 text-xs px-4 py-3',
  },
});

export const showToast = (message, icon = 'success') => {
  Toast.fire({ icon, title: message });
};

export const toastSuccess = (message) => showToast(message, 'success');
export const toastError = (message) => showToast(message, 'error');
export const toastInfo = (message) => showToast(message, 'info');

export const confirmDialog = async ({
  title = 'Are you sure?',
  text = 'This action cannot be undone.',
  confirmButtonText = 'Yes, Proceed',
  cancelButtonText = 'Cancel',
  isDangerous = false,
}) => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    buttonsStyling: false,
    customClass: {
      popup: 'rounded-3xl p-6 max-w-sm shadow-2xl border border-slate-200 font-sans',
      title: 'text-lg font-black text-slate-900 tracking-tight mb-2',
      htmlContainer: 'text-xs text-slate-500 font-medium leading-relaxed',
      actions: 'flex items-center justify-end gap-2.5 mt-5 pt-3 border-t border-slate-100 w-full',
      confirmButton: isDangerous
        ? 'px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer'
        : 'px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer',
      cancelButton:
        'px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer',
    },
  });

  return result.isConfirmed;
};

export default {
  toastSuccess,
  toastError,
  toastInfo,
  confirmDialog,
};
