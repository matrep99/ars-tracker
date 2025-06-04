
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload } from 'lucide-react';
import { CSVUpload } from './CSVUpload';

interface SimplifiedDataEntryProps {
  onDataSaved: () => void;
}

export const SimplifiedDataEntry = ({ onDataSaved }: SimplifiedDataEntryProps) => {
  return (
    <div className="space-y-6">
      {/* CSV Upload Section */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Carica Dati Vendite da CSV
          </CardTitle>
          <CardDescription>
            Carica un file CSV con i dati degli ordini mensili e la spesa pubblicitaria per un'analisi completa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CSVUpload onDataUploaded={onDataSaved} />
        </CardContent>
      </Card>
    </div>
  );
};
