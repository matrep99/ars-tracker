
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { CampaignWithProducts } from '@/lib/supabaseService';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

interface CampaignChartsProps {
  campaigns: CampaignWithProducts[];
}

export const CampaignCharts = ({ campaigns }: CampaignChartsProps) => {
  if (campaigns.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Andamento ROI</CardTitle>
            <CardDescription>Evoluzione del ROI nel tempo</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-gray-500">Aggiungi campagne per visualizzare i grafici</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Budget vs Fatturato</CardTitle>
            <CardDescription>Confronto tra investimenti e ricavi</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-gray-500">Aggiungi campagne per visualizzare i grafici</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare data for charts
  const chartData = campaigns
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .map(campaign => ({
      nome: campaign.titolo,
      data: format(parseISO(campaign.data), 'dd/MM', { locale: it }),
      budget: campaign.budget,
      fatturato: campaign.fatturato,
      roi: campaign.roi,
      ordini: campaign.ordini,
      valoreMedioOrdine: campaign.valore_medio_ordine
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Andamento ROI</CardTitle>
          <CardDescription>Evoluzione del ROI nel tempo</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'ROI']}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="roi" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Budget vs Fatturato</CardTitle>
          <CardDescription>Confronto tra investimenti e ricavi</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`€${value.toLocaleString()}`, value === chartData[0]?.budget ? 'Budget' : 'Fatturato']}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Bar dataKey="budget" fill="#3b82f6" name="Budget" />
              <Bar dataKey="fatturato" fill="#10b981" name="Fatturato" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Numero di Ordini</CardTitle>
          <CardDescription>Ordini generati per campagna</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [value, 'Ordini']}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Bar dataKey="ordini" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Valore Medio Ordine</CardTitle>
          <CardDescription>AOV per ogni campagna</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`€${value.toFixed(2)}`, 'Valore Medio Ordine']}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="valoreMedioOrdine" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
