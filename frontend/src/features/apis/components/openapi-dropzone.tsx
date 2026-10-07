import { UploadCloud } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function OpenApiDropzone() {
  return (
    <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 p-8 text-center flex flex-col items-center justify-center space-y-4">
      <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <UploadCloud className="h-6 w-6 text-slate-500" />
      </div>
      <div>
        <h4 className="text-sm font-semibold">Import OpenAPI Spec</h4>
        <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
          Drag and drop a Swagger/OpenAPI JSON or YAML file, or click to browse.
        </p>
      </div>
      <Button variant="secondary" size="sm">Browse Files</Button>
    </Card>
  );
}
