// client/src/ui/components/Modal.jsx
import React, { Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Description,
  Transition,
  TransitionChild
} from "@headlessui/react";
import clsx from "clsx";

export default function Modal({
  open,
  onClose,
  title,
  description,
  className,
  children,
  footer
}) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95 translate-y-2"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-2"
            >
              <DialogPanel
                className={clsx(
                  "w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-950 text-slate-100 shadow-[0_25px_80px_rgba(0,0,0,0.55)]",
                  className
                )}
              >
                <div className="p-6">
                  {title ? (
                    <DialogTitle className="text-lg font-extrabold">
                      {title}
                    </DialogTitle>
                  ) : null}
                  {description ? (
                    <Description className="mt-2 text-sm text-slate-300/90">
                      {description}
                    </Description>
                  ) : null}

                  {children ? <div className="mt-5">{children}</div> : null}
                </div>

                {footer ? (
                  <div className="flex items-center justify-end gap-2 border-t border-slate-800/70 bg-slate-900/30 p-4">
                    {footer}
                  </div>
                ) : null}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
