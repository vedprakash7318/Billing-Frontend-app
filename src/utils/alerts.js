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
    icon: isDangerous ? 'warning' : 'question',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    buttonsStyling: false,
    customClass: {
      popup: '!rounded-3xl !p-5 sm:!p-6 !max-w-[340px] !w-full !shadow-2xl !border !border-slate-200 font-sans !mx-auto',
      title: '!text-base sm:!text-lg !font-black !text-slate-900 !tracking-tight !mb-1.5',
      htmlContainer: '!text-xs !text-slate-500 !font-medium !leading-relaxed !m-0',
      actions: '!flex !items-center !justify-between !gap-2.5 !mt-5 !pt-3 !border-t !border-slate-100 !w-full',
      confirmButton: isDangerous
        ? '!flex-1 !py-3 !px-4 !bg-rose-600 hover:!bg-rose-700 active:!scale-95 !text-white !text-xs !font-black !rounded-2xl !shadow-md !shadow-rose-600/25 !transition-all !cursor-pointer !text-center'
        : '!flex-1 !py-3 !px-4 !bg-emerald-600 hover:!bg-emerald-700 active:!scale-95 !text-white !text-xs !font-black !rounded-2xl !shadow-md !shadow-emerald-600/25 !transition-all !cursor-pointer !text-center',
      cancelButton:
        '!flex-1 !py-3 !px-4 !bg-slate-100 hover:!bg-slate-200 active:!scale-95 !text-slate-700 !text-xs !font-bold !rounded-2xl !transition-all !cursor-pointer !text-center',
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
