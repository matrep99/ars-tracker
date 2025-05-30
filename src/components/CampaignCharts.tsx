
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { CampaignRecord } from '@/lib/campaignStorage';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface CampaignChartsProps {
  campaigns: CampaignRecord[];
}

export const CampaignCharts = ({ campaigns }: CampaignChartsProps) => {
  const chartData = campaigns
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .map(campaign => ({
      data: format(new Date(campaign.data), 'dd MMM', { locale: it }),
      dataCompleta: campaign.data,
      budget: campaign.budget,
      fatturato: campaign.fatturato,
      roi: campaign.roi,
      valoreMedioOrdine: campaign.valoreMedioOrdine,
      titolo: campaign.titolo
    }));

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Grafici delle Performance</CardTitle>
          <CardDescription>Aggiungi alcune campagne per visualizzare i grafici</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-gray-500">Nessun dato disponibile</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Fatturato vs Budget nel Tempo</CardTitle>
          <CardDescription>Confronta la spesa con il fatturato generato</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="data" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `€${value.toLocaleString()}`,
                  name === 'budget' ? 'Budget' : 'Fatturato'
                ]}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Legend />
              <Bar dataKey="budget" fill="#3b82f6" name="Budget" />
              <Bar dataKey="fatturato" fill="#10b981" name="Fatturato" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Andamento del ROI</CardTitle>
          <CardDescription>Monitora il ritorno sull'investimento nel tempo</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="data" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'ROI']}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="roi" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Variazione del Valore Medio Ordine</CardTitle>
          <CardDescription>Traccia l'evoluzione del valore medio degli ordini</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="data" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`€${value.toFixed(2)}`, 'Valore Medio Ordine']}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="valoreMedioOrdine" 
                stroke="#f59e0b" 
                strokeWidth={3}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
