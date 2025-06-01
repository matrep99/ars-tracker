import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Euro,
  Plus,
  Trash2,
  Edit,
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  getAllCampaignsFromSupabase,
  saveCampaignToSupabase,
  deleteCampaignFromSupabase,
  CampaignData,
  CampaignWithProducts,
} from '@/lib/supabaseService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DateFilter, DateRange } from '@/components/DateFilter';
import { CampaignEditDialog } from '@/components/CampaignEditDialog';
import { PerformanceCharts } from '@/components/PerformanceCharts';
import { CampaignCharts } from '@/components/CampaignCharts';
import { ProductLeaderboard } from '@/components/ProductLeaderboard';
import { DataSharing } from '@/components/DataSharing';
import { PasswordProtection } from '@/components/PasswordProtection';
import { AmazonRevenue } from '@/components/AmazonRevenue';
import { IntegratedMarginCalculator } from '@/components/IntegratedMarginCalculator';

interface DateRange {
  startDate: string | null;
  endDate: string | null;
  type: 'all' | 'custom';
}

const Index = () => {
  const [campaigns, setCampaigns] = useState<CampaignWithProducts[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignWithProducts | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '',
    endDate: '',
    type: 'all',
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState<Omit<CampaignData, 'id' | 'created_at' | 'updated_at'>>({
    titolo: '',
    descrizione: '',
    budget: 0,
    fatturato: 0,
    ordini: 0,
    prodotti: 0,
    data: new Date().toISOString().slice(0, 10),
    roi: 0,
    valore_medio_ordine: 0,
    prodotti_medi_per_ordine: 0,
  });
  const [productForm, setProductForm] = useState({ nome: '', quantita: '' });
  const [campaignProducts, setCampaignProducts] = useState<{ nome: string; quantita: number }[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadCampaigns();
  }, [dateRange]);

  const loadCampaigns = async () => {
    try {
      setIsLoading(true);
      const campaignsData = await getAllCampaignsFromSupabase();
      setCampaigns(campaignsData);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast({
        title: "Errore nel caricamento",
        description: "Impossibile caricare le campagne",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    if (!formData.titolo || !formData.data || formData.budget <= 0 || formData.fatturato <= 0 || formData.ordini <= 0 || formData.prodotti <= 0) {
      toast({
        title: "Errore",
        description: "Per favore, compila tutti i campi correttamente.",
        variant: "destructive",
      });
      return;
    }

    // Calculate derived fields
    const valore_medio_ordine = formData.ordini > 0 ? formData.fatturato / formData.ordini : 0;
    const prodotti_medi_per_ordine = formData.ordini > 0 ? formData.prodotti / formData.ordini : 0;
    const roi = formData.budget > 0 ? ((formData.fatturato - formData.budget) / formData.budget) * 100 : 0;

    try {
      setIsLoading(true);
      const campaignData: Omit<CampaignData, 'id' | 'created_at' | 'updated_at'> = {
        ...formData,
        valore_medio_ordine,
        prodotti_medi_per_ordine,
        roi,
      };
      await saveCampaignToSupabase(campaignData, campaignProducts);
      await loadCampaigns();
      setFormData({
        titolo: '',
        descrizione: '',
        budget: 0,
        fatturato: 0,
        ordini: 0,
        prodotti: 0,
        data: new Date().toISOString().slice(0, 10),
        roi: 0,
        valore_medio_ordine: 0,
        prodotti_medi_per_ordine: 0,
      });
      setCampaignProducts([]);
      setProductForm({ nome: '', quantita: '' });
      toast({
        title: "Campagna salvata",
        description: "La campagna è stata salvata con successo.",
      });
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast({
        title: "Errore nel salvataggio",
        description: "Impossibile salvare la campagna.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      setIsLoading(true);
      await deleteCampaignFromSupabase(campaignId);
      await loadCampaigns();
      toast({
        title: "Campagna eliminata",
        description: "La campagna è stata eliminata con successo.",
      });
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Errore nell'eliminazione",
        description: "Impossibile eliminare la campagna.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCampaign = async (updatedCampaign: CampaignWithProducts) => {
    try {
      setIsLoading(true);
      // Prepare the data for update
      const { id, created_at, updated_at, campaign_products, ...campaignData } = updatedCampaign;

      // Calculate derived fields
      const valore_medio_ordine = campaignData.ordini > 0 ? campaignData.fatturato / campaignData.ordini : 0;
      const prodotti_medi_per_ordine = campaignData.ordini > 0 ? campaignData.prodotti / campaignData.ordini : 0;
      const roi = campaignData.budget > 0 ? ((campaignData.fatturato - campaignData.budget) / campaignData.budget) * 100 : 0;

      const updatedData: CampaignData = {
        ...campaignData,
        valore_medio_ordine,
        prodotti_medi_per_ordine,
        roi,
      };

      // Update the campaign in Supabase
      const { error } = await supabase
        .from('campaigns')
        .update(updatedData)
        .eq('id', id);

      if (error) {
        console.error('Error updating campaign:', error);
        toast({
          title: "Errore nell'aggiornamento",
          description: "Impossibile aggiornare la campagna.",
          variant: "destructive",
        });
        return;
      }

      // Update products (assuming you want to replace existing products with new ones)
      // First, delete existing products
      const { error: deleteError } = await supabase
        .from('campaign_products')
        .delete()
        .eq('campaign_id', id);

      if (deleteError) {
        console.error('Error deleting existing products:', deleteError);
        toast({
          title: "Errore nell'aggiornamento prodotti",
          description: "Impossibile aggiornare i prodotti della campagna.",
          variant: "destructive",
        });
        return;
      }

      // Then, insert new products
      if (campaign_products && campaign_products.length > 0) {
        const productsToInsert = campaign_products.map(product => ({
          campaign_id: id,
          nome: product.nome,
          quantita: product.quantita
        }));

        const { error: insertError } = await supabase
          .from('campaign_products')
          .insert(productsToInsert);

        if (insertError) {
          console.error('Error inserting new products:', insertError);
          toast({
            title: "Errore nell'inserimento prodotti",
            description: "Impossibile inserire i nuovi prodotti della campagna.",
            variant: "destructive",
          });
          return;
        }
      }

      // Reload campaigns to reflect the changes
      await loadCampaigns();
      setIsEditDialogOpen(false);
      toast({
        title: "Campagna aggiornata",
        description: "La campagna è stata aggiornata con successo.",
      });
    } catch (error) {
      console.error('Error editing campaign:', error);
      toast({
        title: "Errore nella modifica",
        description: "Impossibile modificare la campagna.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addProductToCampaign = () => {
    if (productForm.nome && productForm.quantita) {
      setCampaignProducts([...campaignProducts, { nome: productForm.nome, quantita: parseInt(productForm.quantita) }]);
      setProductForm({ nome: '', quantita: '' });
    }
  };

  const removeProductFromCampaign = (index: number) => {
    const newProducts = [...campaignProducts];
    newProducts.splice(index, 1);
    setCampaignProducts(newProducts);
  };

  const openEditDialog = (campaign: CampaignWithProducts) => {
    setEditingCampaign(campaign);
    setIsEditDialogOpen(true);
  };

  // Calculate totals for summary cards
  const totalBudget = campaigns.reduce((sum, campaign) => sum + campaign.budget, 0);
  const totalRevenue = campaigns.reduce((sum, campaign) => sum + campaign.fatturato, 0);
  const totalOrders = campaigns.reduce((sum, campaign) => sum + campaign.ordini, 0);
  const averageROI = campaigns.length > 0
    ? campaigns.reduce((sum, campaign) => sum + campaign.roi, 0) / campaigns.length
    : 0;

  // Calculate Amazon total spend
  const amazonTotalSpend = 0;

  // Filter campaigns based on date range
  const filteredCampaigns = campaigns.filter(campaign => {
    if (dateRange.type === 'all') {
      return true;
    }

    if (!dateRange.startDate || !dateRange.endDate) {
      return true; // or show a message that date range is not valid
    }

    const campaignDate = new Date(campaign.data);
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);

    return campaignDate >= startDate && campaignDate <= endDate;
  });

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };

  return (
    <PasswordProtection onAuthenticated={() => setIsAuthenticated(true)}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard Marketing</h1>
                <p className="text-gray-600 mt-1">Monitora e analizza i dati in tempo reale</p>
              </div>
              <DateFilter onDateRangeChange={handleDateRangeChange} currentRange={dateRange} />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="campaigns" className="space-y-8">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="campaigns">Campagne</TabsTrigger>
              <TabsTrigger value="amazon">Amazon</TabsTrigger>
              <TabsTrigger value="margin">Calcolatore Margini</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="campaigns" className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Spesa Ads Totale</CardTitle>
                    <Euro className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">€{totalBudget.toLocaleString()}</div>
                    <p className="text-xs text-gray-500 mt-1">Investimento pubblicitario</p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Fatturato Totale</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">€{totalRevenue.toLocaleString()}</div>
                    <p className="text-xs text-gray-500 mt-1">Ricavi generati</p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Ordini Totali</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{totalOrders.toLocaleString()}</div>
                    <p className="text-xs text-gray-500 mt-1">Conversioni totali</p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">ROI Medio</CardTitle>
                    <Package className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${averageROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {averageROI.toFixed(1)}%
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Return on Investment</p>
                  </CardContent>
                </Card>
              </div>

              {/* Add Campaign Form */}
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Aggiungi Nuova Campagna
                  </CardTitle>
                  <CardDescription>Inserisci i dettagli della tua campagna pubblicitaria</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="titolo">Titolo Campagna</Label>
                        <Input
                          id="titolo"
                          value={formData.titolo}
                          onChange={(e) => setFormData(prev => ({ ...prev, titolo: e.target.value }))}
                          placeholder="es. Campagna Black Friday"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="data">Data</Label>
                        <Input
                          id="data"
                          type="date"
                          value={formData.data}
                          onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="budget">Spesa Ads (€)</Label>
                        <Input
                          id="budget"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.budget || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, budget: parseFloat(e.target.value) || 0 }))}
                          placeholder="1000.00"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fatturato">Fatturato (€)</Label>
                        <Input
                          id="fatturato"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.fatturato || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, fatturato: parseFloat(e.target.value) || 0 }))}
                          placeholder="3000.00"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ordini">Numero Ordini</Label>
                        <Input
                          id="ordini"
                          type="number"
                          min="1"
                          value={formData.ordini || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, ordini: parseInt(e.target.value) || 0 }))}
                          placeholder="15"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prodotti">Prodotti Venduti</Label>
                        <Input
                          id="prodotti"
                          type="number"
                          min="1"
                          value={formData.prodotti || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, prodotti: parseInt(e.target.value) || 0 }))}
                          placeholder="45"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="descrizione">Descrizione (opzionale)</Label>
                      <Input
                        id="descrizione"
                        value={formData.descrizione}
                        onChange={(e) => setFormData(prev => ({ ...prev, descrizione: e.target.value }))}
                        placeholder="Breve descrizione della campagna"
                      />
                    </div>

                    {/* Product Input Section */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h4 className="font-medium mb-3">Prodotti Venduti</h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="product-name">Nome Prodotto</Label>
                            <Input
                              id="product-name"
                              value={productForm.nome}
                              onChange={(e) => setProductForm(prev => ({ ...prev, nome: e.target.value }))}
                              placeholder="es. iPhone 15"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="product-quantity">Quantità</Label>
                            <Input
                              id="product-quantity"
                              type="number"
                              min="1"
                              value={productForm.quantita}
                              onChange={(e) => setProductForm(prev => ({ ...prev, quantita: e.target.value }))}
                              placeholder="10"
                            />
                          </div>
                        </div>
                        <Button 
                          type="button" 
                          onClick={addProductToCampaign}
                          size="sm"
                          className="w-full md:w-auto"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Aggiungi Prodotto
                        </Button>
                      </div>

                      {campaignProducts.length > 0 && (
                        <div className="mt-4">
                          <h5 className="font-medium mb-2">Prodotti aggiunti:</h5>
                          <div className="space-y-2">
                            {campaignProducts.map((product, index) => (
                              <div key={index} className="flex justify-between items-center bg-white p-2 rounded border">
                                <span>{product.nome} - Qtà: {product.quantita}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeProductFromCampaign(index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Salvataggio...' : 'Salva Campagna'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Campaigns Table */}
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle>Campagne Recenti</CardTitle>
                  <CardDescription>Visualizza e gestisci le tue campagne pubblicitarie</CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredCampaigns.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Nessuna campagna trovata. Aggiungi la prima campagna per iniziare!</p>
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
                            <TableHead className="text-right">VMO</TableHead>
                            <TableHead className="w-[100px]">Azioni</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCampaigns.map((campaign) => (
                            <TableRow key={campaign.id} className="hover:bg-gray-50">
                              <TableCell>
                                <div>
                                  <div className="font-medium">{campaign.titolo}</div>
                                  {campaign.descrizione && (
                                    <div className="text-sm text-gray-500">{campaign.descrizione}</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{format(new Date(campaign.data), 'dd/MM/yyyy')}</TableCell>
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
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditDialog(campaign)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteCampaign(campaign.id!)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
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

            <TabsContent value="amazon" className="space-y-8">
              <AmazonRevenue dateRange={dateRange} />
            </TabsContent>

            <TabsContent value="margin" className="space-y-8">
              <IntegratedMarginCalculator 
                totalCampaignSpend={totalBudget}
                totalAmazonSpend={amazonTotalSpend}
                dateRange={dateRange}
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <PerformanceCharts records={[]} />
                <CampaignCharts campaigns={filteredCampaigns} />
              </div>
              <ProductLeaderboard campaigns={filteredCampaigns} />
              <DataSharing campaigns={filteredCampaigns} />
            </TabsContent>
          </Tabs>
        </div>

        <CampaignEditDialog 
          campaign={editingCampaign}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSave={handleEditCampaign}
        />
      </div>
    </PasswordProtection>
  );
};

export default Index;
