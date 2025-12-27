
import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  helperText?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, helperText, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 h-full">
      <label className="text-sm font-bold text-gray-600 uppercase tracking-tight">
        {label}
      </label>
      <textarea
        className={`w-full p-4 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-[#0077B5]/20 focus:border-[#0077B5] transition-all text-sm leading-relaxed bg-white outline-none ${className}`}
        {...props}
      />
      {helperText && <span className="text-[10px] text-gray-400 font-medium">{helperText}</span>}
    </div>
  );
};
