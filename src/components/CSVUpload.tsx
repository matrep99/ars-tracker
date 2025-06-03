
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Trash2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { parseCSVContent, saveMonthlyOrderData, CSVRow } from '@/lib/monthlyOrderService';

interface CSVUploadProps {
  onDataUploaded: () => void;
}

export const CSVUpload = ({ onDataUploaded }: CSVUploadProps) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('T')[0].slice(0, 7));
  const [isAmazon, setIsAmazon] = useState(false);
  const [parsedData, setParsedData] = useState<CSVRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Formato file non valido",
        description: "Seleziona un file CSV valido",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        console.log('Raw CSV content:', csvContent.substring(0, 500));
        
        setParseErrors([]);
        const parsed = parseCSVContent(csvContent);
        setParsedData(parsed);
        
        if (parsed.length === 0) {
          setParseErrors(['Il file CSV non contiene dati validi o le colonne non sono state riconosciute']);
          toast({
            title: "CSV vuoto",
            description: "Il file CSV non contiene dati validi",
            variant: "destructive"
          });
        } else {
          toast({
            title: "CSV caricato con successo",
            description: `${parsed.length} righe elaborate correttamente`
          });
        }
      } catch (error) {
        console.error('Error parsing CSV:', error);
        const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
        setParseErrors([errorMessage]);
        toast({
          title: "Errore nel parsing",
          description: errorMessage,
          variant: "destructive"
        });
        setParsedData([]);
      }
    };
    
    reader.readAsText(file, 'UTF-8');
  };

  const handleSaveData = async () => {
    if (parsedData.length === 0) {
      toast({
        title: "Nessun dato",
        description: "Carica prima un file CSV",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const monthlyOrderData = parsedData.map(row => ({
        month: selectedMonth + '-01', // Convert YYYY-MM to YYYY-MM-DD
        prodotto: row.prodotto,
        pezzi_totali: row.pezzi_totali,
        importo_totale_iva_inclusa: row.importo_totale_iva_inclusa,
        iva: row.iva,
        imponibile_totale: row.imponibile_totale,
        is_amazon: isAmazon
      }));

      await saveMonthlyOrderData(monthlyOrderData);
      
      toast({
        title: "Dati salvati con successo",
        description: `${parsedData.length} record salvati per ${selectedMonth}`
      });
      
      setParsedData([]);
      setParseErrors([]);
      onDataUploaded();
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: "Errore nel salvataggio",
        description: "Impossibile salvare i dati",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearData = () => {
    setParsedData([]);
    setParseErrors([]);
  };

  const totalRevenue = parsedData.reduce((sum, row) => sum + row.importo_totale_iva_inclusa, 0);
  const totalTaxable = parsedData.reduce((sum, row) => sum + row.imponibile_totale, 0);
  const totalUnits = parsedData.reduce((sum, row) => sum + row.pezzi_totali, 0);
  const totalTax = parsedData.reduce((sum, row) => sum + row.iva, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Carica Dati Mensili da CSV
          </CardTitle>
          <CardDescription>
            Colonne richieste: Prodotto, Pezzi totali, Importo totale (€), IVA (€), Imponibile totale (€)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Mese di Riferimento</Label>
              <Input
                id="month"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="csvFile">File CSV</Label>
              <Input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
              />
            </div>
            
            <div className="flex items-center space-x-2 mt-6">
              <Checkbox
                id="isAmazon"
                checked={isAmazon}
                onCheckedChange={(checked) => setIsAmazon(checked as boolean)}
              />
              <Label htmlFor="isAmazon">Dati Amazon</Label>
            </div>
          </div>

          {parseErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {parseErrors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Anteprima Dati ({parsedData.length} righe)
                </CardTitle>
                <CardDescription>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                    <div>Fatturato lordo: €{totalRevenue.toLocaleString()}</div>
                    <div>Fatturato netto: €{totalTaxable.toLocaleString()}</div>
                    <div>IVA totale: €{totalTax.toLocaleString()}</div>
                    <div>Pezzi totali: {totalUnits.toLocaleString()}</div>
                  </div>
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={clearData}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cancella
                </Button>
                <Button
                  onClick={handleSaveData}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? 'Salvataggio...' : 'Salva Dati'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Prodotto</TableHead>
                    <TableHead className="text-right">Pezzi</TableHead>
                    <TableHead className="text-right">Importo Tot. (€)</TableHead>
                    <TableHead className="text-right">IVA (€)</TableHead>
                    <TableHead className="text-right">Imponibile (€)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.prodotto}</TableCell>
                      <TableCell className="text-right">{row.pezzi_totali}</TableCell>
                      <TableCell className="text-right">€{row.importo_totale_iva_inclusa.toFixed(2)}</TableCell>
                      <TableCell className="text-right">€{row.iva.toFixed(2)}</TableCell>
                      <TableCell className="text-right">€{row.imponibile_totale.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
