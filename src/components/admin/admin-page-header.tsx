import React from 'react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export function AdminPageHeader({ 
  title, 
  description, 
  icon, 
  actions 
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between mb-8 gap-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="rounded-md bg-orange-100 p-2 text-orange-600">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex-shrink-0 flex gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
