import React from 'react';
import { toast as sonnerToast } from 'sonner';

export interface ToastActionOptions {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  description?: string;
  duration?: number;
  action?: ToastActionOptions;
  cancel?: {
    label: string;
    onClick?: () => void;
  };
}

/**
 * Toast system with notification stacking, auto-dismiss, action buttons,
 * and high-contrast semantic variants.
 */
export const toast = {
  message(title: string, options?: ToastOptions) {
    return sonnerToast(title, {
      description: options?.description,
      duration: options?.duration ?? 4000,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
    });
  },

  success(title: string, options?: ToastOptions) {
    return sonnerToast.success(title, {
      description: options?.description,
      duration: options?.duration ?? 4000,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
    });
  },

  error(title: string, options?: ToastOptions) {
    return sonnerToast.error(title, {
      description: options?.description,
      duration: options?.duration ?? 5000,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
    });
  },

  warning(title: string, options?: ToastOptions) {
    return sonnerToast.warning(title, {
      description: options?.description,
      duration: options?.duration ?? 4500,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
    });
  },

  info(title: string, options?: ToastOptions) {
    return sonnerToast.info(title, {
      description: options?.description,
      duration: options?.duration ?? 4000,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
    });
  },

  dismiss(toastId?: string | number) {
    return sonnerToast.dismiss(toastId);
  },
};
