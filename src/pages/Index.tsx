import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { CampaignCharts } from '@/components/CampaignCharts';
import { ProductLeaderboard } from '@/components/ProductLeaderboard';
import { PasswordProtection } from '@/components/PasswordProtection';
import { AmazonRevenue } from '@/components/AmazonRevenue';
import { IntegratedMarginManager } from '@/components/IntegratedMarginManager';
import { SimplifiedDataEntry } from '@/components/SimplifiedDataEntry';
import { CampaignEditDialog } from '@/components/CampaignEditDialog';
import { DateFilter } from '@/components/DateFilter';
import { Plus, TrendingUp, Euro, ShoppingCart, Package, Trash2, Edit } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  saveCampaignToSupabase, 
  getAllCampaignsFromSupabase, 
  deleteCampaignFromSupabase,
  getCampaignById,
  getCampaignsByDateRange,
  CampaignWithProducts 
} from '@/lib/supabaseService';
import { getAllAmazonRevenue, getAmazonRevenueByDateRange } from '@/lib/amazonRevenueService';
import { getAllMonthlyOrders, getMonthlyOrdersByDateRange } from '@/lib/monthlyOrderService';
import { PaymentMethodsManager } from '@/components/PaymentMethodsManager';

export interface DateRange {
  startDate: string;
  endDate: string;
  type: 'all' | 'month' | 'custom';
}

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignWithProducts[]>([]);
  const [sharedCampaign, setSharedCampaign] = useState<CampaignWithProducts | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignWithProducts | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '',
    endDate: '',
    type: 'all'
  });
  const [amazonData, setAmazonData] = useState([]);
  const [monthlyOrders, setMonthlyOrders] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    // Check for shared campaign in URL
    const urlParams = new URLSearchParams(window.location.search);
    const sharedId = urlParams.get('id');
    
    if (sharedId) {
      setIsReadOnly(true);
      loadSharedCampaign(sharedId);
      return;
    }

    // Check authentication
    const isAuth = localStorage.getItem('app_authenticated') === 'true';
    if (isAuth) {
      setIsAuthenticated(true);
      loadCampaigns();
      loadAmazonData();
      loadMonthlyOrders();
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isReadOnly) {
      loadCampaigns();
      loadAmazonData();
      loadMonthlyOrders();
    }
  }, [dateRange]);

  const loadSharedCampaign = async (campaignId: string) => {
    try {
      setIsLoading(true);
      const campaign = await getCampaignById(campaignId);
      if (campaign) {
        setSharedCampaign(campaign);
        setIsAuthenticated(true);
      } else {
        toast({
          title: "Campagna non trovata",
          description: "La campagna richiesta non esiste o è stata eliminata",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading shared campaign:', error);
      toast({
        title: "Errore nel caricamento",
        description: "Impossibile caricare la campagna condivisa",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCampaigns = async () => {
    try {
      setIsLoading(true);
      let allCampaigns: CampaignWithProducts[];
      
      if (dateRange.type !== 'all' && dateRange.startDate && dateRange.endDate) {
        allCampaigns = await getCampaignsByDateRange(dateRange.startDate, dateRange.endDate);
      } else {
        allCampaigns = await getAllCampaignsFromSupabase();
      }
      
      setCampaigns(allCampaigns);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast({
        title: "Errore nel caricamento",
        description: "Impossibile caricare le campagne salvate",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAmazonData = async () => {
    try {
      let data;
      if (dateRange.type !== 'all' && dateRange.startDate && dateRange.endDate) {
        data = await getAmazonRevenueByDateRange(dateRange.startDate, dateRange.endDate);
      } else {
        data = await getAllAmazonRevenue();
      }
      setAmazonData(data);
    } catch (error) {
      console.error('Error loading Amazon data:', error);
    }
  };

  const loadMonthlyOrders = async () => {
    try {
      let data;
      if (dateRange.type !== 'all' && dateRange.startDate && dateRange.endDate) {
        data = await getMonthlyOrdersByDateRange(dateRange.startDate, dateRange.endDate);
      } else {
        data = await getAllMonthlyOrders();
      }
      setMonthlyOrders(data);
    } catch (error) {
      console.error('Error loading monthly orders:', error);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      setIsLoading(true);
      await deleteCampaignFromSupabase(id);
      await loadCampaigns();
      toast({
        title: "Campagna eliminata",
        description: "La campagna è stata rimossa con successo"
      });
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Errore nell'eliminazione",
        description: "Impossibile eliminare la campagna",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateShareLink = (campaignId: string) => {
    const shareUrl = `${window.location.origin}?id=${campaignId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({
        title: "Link copiato",
        description: "Il link di condivisione è stato copiato negli appunti"
      });
    });
  };

  const handleEditCampaign = (campaign: CampaignWithProducts) => {
    setEditingCampaign(campaign);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    await loadCampaigns();
  };

  const handleDataRefresh = () => {
    loadCampaigns();
    loadAmazonData();
    loadMonthlyOrders();
  };

  if (!isAuthenticated) {
    if (isLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Caricamento in corso...</p>
          </div>
        </div>
      );
    }
    return <PasswordProtection onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  const displayCampaigns = sharedCampaign ? [sharedCampaign] : campaigns;
  const totalSpesaAds = displayCampaigns.reduce((sum, campaign) => sum + campaign.budget, 0);
  const totalFatturato = displayCampaigns.reduce((sum, campaign) => sum + campaign.fatturato, 0);
  const totalOrdini = displayCampaigns.reduce((sum, campaign) => sum + campaign.ordini, 0);
  const overallROI = totalSpesaAds > 0 ? ((totalFatturato - totalSpesaAds) / totalSpesaAds) * 100 : 0;
  const avgValoreMedioOrdine = totalOrdini > 0 ? totalFatturato / totalOrdini : 0;

  // Calculate both gross and net revenue from monthly orders
  const totalNetRevenue = monthlyOrders.reduce((sum, order) => sum + (order.imponibile_totale || 0), 0);
  const totalGrossRevenue = monthlyOrders.reduce((sum, order) => sum + (order.importo_totale_iva_inclusa || 0), 0);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto p-6">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <img 
                src="/lovable-uploads/17d902f5-0c8c-426b-aebc-ce1adba3d45d.png" 
                alt="ARS Logo" 
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  ARS Tracker {isReadOnly && "(Solo Lettura)"}
                </h1>
                <p className="text-lg text-gray-600">
                  Monitora e analizza i dati in tempo reale
                </p>
              </div>
            </div>
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Caricamento...</span>
              </div>
            </div>
          )}

          {/* Date Filter - Smaller and Centered */}
          {!isReadOnly && (
            <div className="mb-6 flex justify-center">
              <div className="w-full max-w-2xl">
                <DateFilter
                  onDateRangeChange={setDateRange}
                  currentRange={dateRange}
                />
              </div>
            </div>
          )}

          {/* Summary Cards - Updated to show both gross and net revenue */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Spesa Ads Totale</CardTitle>
                <Euro className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">€{totalSpesaAds.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Fatturato Lordo</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">€{totalGrossRevenue.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">IVA inclusa</div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Fatturato Netto</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">€{totalNetRevenue.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">Imponibile (IVA esclusa)</div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">ROI Complessivo</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${overallROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {overallROI.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Valore Medio Ordine</CardTitle>
                <ShoppingCart className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">€{avgValoreMedioOrdine.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="campaigns">Campagne</TabsTrigger>
              <TabsTrigger value="products">Classifica Prodotti</TabsTrigger>
              <TabsTrigger value="amazon">Amazon</TabsTrigger>
              <TabsTrigger value="margins">Margini & Costi</TabsTrigger>
              <TabsTrigger value="payments">Pagamenti</TabsTrigger>
              {!isReadOnly && <TabsTrigger value="add">Aggiungi Dati</TabsTrigger>}
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <CampaignCharts campaigns={displayCampaigns} />
            </TabsContent>

            <TabsContent value="campaigns" className="space-y-6">
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle>Tutte le Campagne</CardTitle>
                  <CardDescription>Visualizza e gestisci le tue campagne pubblicitarie</CardDescription>
                </CardHeader>
                <CardContent>
                  {displayCampaigns.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Nessuna campagna trovata. Aggiungi la tua prima campagna per iniziare!</p>
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead>Campagna</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead className="text-right">Spesa Ads</TableHead>
                            <TableHead className="text-right">Fatturato</TableHead>
                            <TableHead className="text-right">Ordini</TableHead>
                            <TableHead className="text-right">ROI</TableHead>
                            <TableHead className="text-right">Val. Medio Ordine</TableHead>
                            <TableHead className="w-[100px]">Azioni</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayCampaigns.map((campaign) => (
                            <TableRow key={campaign.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium">{campaign.titolo}</TableCell>
                              <TableCell>{format(new Date(campaign.data), 'dd MMM yyyy', { locale: it })}</TableCell>
                              <TableCell className="text-right">€{campaign.budget.toLocaleString()}</TableCell>
                              <TableCell className="text-right">€{campaign.fatturato.toLocaleString()}</TableCell>
                              <TableCell className="text-right">{campaign.ordini}</TableCell>
                              <TableCell className="text-right">
                                <Badge 
                                  variant={campaign.roi >= 0 ? "default" : "destructive"}
                                  className={campaign.roi >= 0 ? "bg-green-100 text-green-800" : ""}
                                >
                                  {campaign.roi.toFixed(1)}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">€{campaign.valore_medio_ordine.toFixed(2)}</TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditCampaign(campaign)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    title="Modifica campagna"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => generateShareLink(campaign.id!)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    title="Condividi campagna"
                                  >
                                    📤
                                  </Button>
                                  {!isReadOnly && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteCampaign(campaign.id!)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="space-y-6">
              <ProductLeaderboard />
            </TabsContent>

            <TabsContent value="amazon" className="space-y-6">
              <AmazonRevenue dateRange={dateRange} />
            </TabsContent>

            <TabsContent value="margins" className="space-y-6">
              <IntegratedMarginManager />
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <PaymentMethodsManager dateRange={dateRange} />
            </TabsContent>

            {!isReadOnly && (
              <TabsContent value="add" className="space-y-6">
                <SimplifiedDataEntry onDataSaved={handleDataRefresh} />
              </TabsContent>
            )}
          </Tabs>
        </div>

        <CampaignEditDialog
          campaign={editingCampaign}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSave={handleSaveEdit}
        />
      </div>
    </TooltipProvider>
  );
};

export default Index;
