
import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  helperText?: string;
  isCollapsible?: boolean;
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;
}

import { ChevronDown, ChevronUp } from 'lucide-react';

export const TextArea: React.FC<TextAreaProps> = ({ label, helperText, className = '', isCollapsible = true, icon, headerAction, ...props }) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col transition-all duration-300">
      <div
        className="flex items-center justify-between cursor-pointer group"
        onClick={() => isCollapsible && setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2">
            {React.isValidElement(icon) && (
              <div className={`p-1.5 rounded-lg transition-colors ${isCollapsed ? 'bg-gray-100' : 'bg-blue-50'}`}>
                {React.cloneElement(icon as React.ReactElement<any>, {
                  className: `w-4 h-4 ${isCollapsed ? 'text-gray-400' : 'text-[#0077B5]'}`
                })}
              </div>
            )}
            <h3 className={`text-sm font-bold uppercase tracking-wide transition-colors ${isCollapsed ? 'text-gray-400' : 'text-gray-800'}`}>
              {label}
            </h3>
          </div>

          {headerAction && !isCollapsed && (
            <div className="flex-1 flex justify-end" onClick={(e) => e.stopPropagation()}>
              {headerAction}
            </div>
          )}
        </div>

        {isCollapsible && (
          <div className="text-gray-400 group-hover:text-[#0077B5] transition-all ml-4">
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="mt-4 animate-in slide-in-from-top-1 duration-200 flex flex-col gap-1.5">
          <textarea
            className={`w-full p-4 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-[#0077B5]/20 focus:border-[#0077B5] transition-all text-sm leading-relaxed bg-white outline-none ${className}`}
            {...props}
          />
          {helperText && <span className="text-[10px] text-gray-400 font-medium animate-in fade-in duration-300">{helperText}</span>}
        </div>
      )}

      {isCollapsed && (
        <div
          className="mt-2 text-[10px] text-[#0077B5] font-bold uppercase tracking-widest bg-blue-50/50 px-2 py-1 rounded border border-blue-100/50 w-fit animate-in zoom-in-95 duration-200"
          onClick={(e) => {
            e.stopPropagation();
            setIsCollapsed(false);
          }}
        >
          Minimized
        </div>
      )}
    </div>
  );
};
