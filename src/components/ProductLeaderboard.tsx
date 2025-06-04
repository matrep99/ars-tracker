
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { getAllMonthlyOrders, MonthlyOrderData } from '@/lib/monthlyOrderService';

interface ProductRanking {
  position: number;
  nome: string;
  quantita: number;
}

export const ProductLeaderboard = () => {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
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

  // Get all available months from monthly orders
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    monthlyOrders.forEach(order => {
      const date = parseISO(order.month);
      const monthKey = format(date, 'yyyy-MM');
      months.add(monthKey);
    });
    return Array.from(months).sort().reverse();
  }, [monthlyOrders]);

  // Calculate general leaderboard (all orders)
  const generalLeaderboard = useMemo(() => {
    const productMap = new Map<string, number>();
    
    monthlyOrders.forEach(order => {
      const current = productMap.get(order.prodotto) || 0;
      productMap.set(order.prodotto, current + order.pezzi_totali);
    });

    return Array.from(productMap.entries())
      .map(([nome, quantita], index) => ({ position: index + 1, nome, quantita }))
      .sort((a, b) => b.quantita - a.quantita)
      .map((item, index) => ({ ...item, position: index + 1 }));
  }, [monthlyOrders]);

  // Calculate monthly leaderboard
  const monthlyLeaderboard = useMemo(() => {
    if (!selectedMonth) return [];
    
    const productMap = new Map<string, number>();
    
    monthlyOrders.forEach(order => {
      const orderMonth = format(parseISO(order.month), 'yyyy-MM');
      if (orderMonth === selectedMonth) {
        const current = productMap.get(order.prodotto) || 0;
        productMap.set(order.prodotto, current + order.pezzi_totali);
      }
    });

    return Array.from(productMap.entries())
      .map(([nome, quantita], index) => ({ position: index + 1, nome, quantita }))
      .sort((a, b) => b.quantita - a.quantita)
      .map((item, index) => ({ ...item, position: index + 1 }));
  }, [monthlyOrders, selectedMonth]);

  const currentLeaderboard = selectedMonth ? monthlyLeaderboard : generalLeaderboard;

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="h-5 w-5 flex items-center justify-center text-gray-600 font-bold">{position}</span>;
    }
  };

  const getPositionBadgeColor = (position: number) => {
    switch (position) {
      case 1:
        return "bg-yellow-100 text-yellow-800";
      case 2:
        return "bg-gray-100 text-gray-800";
      case 3:
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Classifica Prodotti</CardTitle>
          <CardDescription>Caricamento dati...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-gray-500">Caricamento...</p>
        </CardContent>
      </Card>
    );
  }

  if (monthlyOrders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Classifica Prodotti</CardTitle>
          <CardDescription>Carica dati CSV per visualizzare la classifica dei prodotti</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-gray-500">Nessun prodotto trovato</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Classifica Prodotti</CardTitle>
          <CardDescription>
            {selectedMonth 
              ? `Classifica per ${format(parseISO(selectedMonth + '-01'), 'MMMM yyyy', { locale: it })}`
              : 'Classifica generale di tutti i prodotti'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Month selection buttons */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedMonth === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMonth(null)}
              >
                Classifica Generale
              </Button>
              {availableMonths.map(month => (
                <Button
                  key={month}
                  variant={selectedMonth === month ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedMonth(month)}
                >
                  {format(parseISO(month + '-01'), 'MMM yyyy', { locale: it })}
                </Button>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          {currentLeaderboard.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {selectedMonth 
                  ? 'Nessun prodotto trovato per questo mese'
                  : 'Nessun prodotto trovato'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentLeaderboard.map((product) => (
                <div
                  key={`${product.nome}-${product.position}`}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getPositionIcon(product.position)}
                      <Badge className={getPositionBadgeColor(product.position)}>
                        #{product.position}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{product.nome}</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {product.quantita}
                    </div>
                    <div className="text-sm text-gray-500">
                      {product.quantita === 1 ? 'unità venduta' : 'unità vendute'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
