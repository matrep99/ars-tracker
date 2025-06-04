
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAllMonthlyOrders, MonthlyOrderData } from '@/lib/monthlyOrderService';

export const ProductRanking = () => {
  const [monthlyOrders, setMonthlyOrders] = useState<MonthlyOrderData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadMonthlyOrders();
  }, []);

  const loadMonthlyOrders = async () => {
    try {
      setIsLoading(true);
      const data = await getAllMonthlyOrders();
      setMonthlyOrders(data);
    } catch (error) {
      console.error('Error loading monthly orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const aggregateProducts = () => {
    const productMap = new Map<string, number>();
    
    monthlyOrders.forEach(order => {
      const current = productMap.get(order.prodotto) || 0;
      productMap.set(order.prodotto, current + order.pezzi_totali);
    });

    return Array.from(productMap.entries())
      .map(([nome, quantita]) => ({ nome, quantita }))
      .sort((a, b) => b.quantita - a.quantita)
      .slice(0, 10);
  };

  const topProducts = aggregateProducts();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Classifica Prodotti Più Venduti</CardTitle>
          <CardDescription>Caricamento dati...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-gray-500">Caricamento...</p>
        </CardContent>
      </Card>
    );
  }

  if (topProducts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Classifica Prodotti Più Venduti</CardTitle>
          <CardDescription>Carica dati CSV per visualizzare la classifica</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-gray-500">Nessun prodotto trovato</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Classifica Prodotti Più Venduti</CardTitle>
        <CardDescription>I 10 prodotti con il maggior numero di vendite</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={topProducts} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis 
              dataKey="nome" 
              type="category" 
              width={120}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: number) => [value, 'Quantità Venduta']}
              labelFormatter={(label) => `Prodotto: ${label}`}
            />
            <Bar dataKey="quantita" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
