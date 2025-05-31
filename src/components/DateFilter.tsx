
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { it } from 'date-fns/locale';

export interface DateRange {
  startDate: string;
  endDate: string;
  type: 'all' | 'month' | 'custom';
}

interface DateFilterProps {
  onDateRangeChange: (range: DateRange) => void;
  currentRange: DateRange;
}

export const DateFilter = ({ onDateRangeChange, currentRange }: DateFilterProps) => {
  const [filterType, setFilterType] = useState<'all' | 'month' | 'custom'>(currentRange.type);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const handleFilterChange = (type: 'all' | 'month' | 'custom') => {
    setFilterType(type);
    
    if (type === 'all') {
      onDateRangeChange({
        startDate: '',
        endDate: '',
        type: 'all'
      });
    }
  };

  const handleMonthSelect = (month: string) => {
    setSelectedMonth(month);
    const date = new Date(month + '-01');
    const start = format(startOfMonth(date), 'yyyy-MM-dd');
    const end = format(endOfMonth(date), 'yyyy-MM-dd');
    
    onDateRangeChange({
      startDate: start,
      endDate: end,
      type: 'month'
    });
  };

  const handleCustomRange = () => {
    if (customStart && customEnd) {
      onDateRangeChange({
        startDate: customStart,
        endDate: customEnd,
        type: 'custom'
      });
    }
  };

  const clearFilter = () => {
    onDateRangeChange({
      startDate: '',
      endDate: '',
      type: 'all'
    });
    setFilterType('all');
  };

  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 24; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = format(date, 'yyyy-MM');
      const label = format(date, 'MMMM yyyy', { locale: it });
      options.push({ value, label });
    }
    
    return options;
  };

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5" />
          Filtro Date
          {currentRange.type !== 'all' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilter}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            onClick={() => handleFilterChange('all')}
            size="sm"
          >
            Tutti
          </Button>
          <Button
            variant={filterType === 'month' ? 'default' : 'outline'}
            onClick={() => handleFilterChange('month')}
            size="sm"
          >
            Mese
          </Button>
          <Button
            variant={filterType === 'custom' ? 'default' : 'outline'}
            onClick={() => handleFilterChange('custom')}
            size="sm"
          >
            Personalizzato
          </Button>
        </div>

        {filterType === 'month' && (
          <div className="space-y-2">
            <Label>Seleziona Mese</Label>
            <Select value={selectedMonth} onValueChange={handleMonthSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona un mese" />
              </SelectTrigger>
              <SelectContent>
                {generateMonthOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {filterType === 'custom' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="start-date">Data Inizio</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="end-date">Data Fine</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
            </div>
            <Button 
              onClick={handleCustomRange} 
              className="w-full"
              disabled={!customStart || !customEnd}
            >
              Applica Filtro
            </Button>
          </div>
        )}

        {currentRange.type !== 'all' && (
          <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
            <strong>Filtro attivo:</strong>{' '}
            {currentRange.type === 'month' 
              ? format(new Date(currentRange.startDate), 'MMMM yyyy', { locale: it })
              : `${format(new Date(currentRange.startDate), 'dd/MM/yyyy')} - ${format(new Date(currentRange.endDate), 'dd/MM/yyyy')}`
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
};
