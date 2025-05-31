
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CampaignCharts } from '@/components/CampaignCharts';
import { ProductLeaderboard } from '@/components/ProductLeaderboard';
import { PasswordProtection } from '@/components/PasswordProtection';
import { Plus, TrendingUp, Euro, ShoppingCart, Package, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  saveCampaignToSupabase, 
  getAllCampaignsFromSupabase, 
  deleteCampaignFromSupabase,
  getCampaignById,
  CampaignWithProducts 
} from '@/lib/supabaseService';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignWithProducts[]>([]);
  const [sharedCampaign, setSharedCampaign] = useState<CampaignWithProducts | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    titolo: '',
    descrizione: '',
    budget: '',
    fatturato: '',
    ordini: '',
    prodotti: '',
    data: new Date().toISOString().split('T')[0]
  });
  const [productInput, setProductInput] = useState({ nome: '', quantita: '' });
  const [productList, setProductList] = useState<{ nome: string; quantita: number }[]>([]);
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
    }
  }, []);

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
      const allCampaigns = await getAllCampaignsFromSupabase();
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

  const addProduct = () => {
    if (productInput.nome && productInput.quantita) {
      const newProduct = {
        nome: productInput.nome,
        quantita: parseInt(productInput.quantita)
      };
      setProductList([...productList, newProduct]);
      setProductInput({ nome: '', quantita: '' });
    }
  };

  const removeProduct = (index: number) => {
    setProductList(productList.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const budget = parseFloat(formData.budget);
    const fatturato = parseFloat(formData.fatturato);
    const ordini = parseInt(formData.ordini);
    const prodotti = parseInt(formData.prodotti);

    if (budget < 0 || fatturato < 0 || ordini < 0 || prodotti < 0) {
      toast({
        title: "Valori non validi",
        description: "Tutti i valori devono essere numeri positivi",
        variant: "destructive"
      });
      return;
    }

    const roi = budget > 0 ? ((fatturato - budget) / budget) * 100 : 0;
    const valoreMedioOrdine = ordini > 0 ? fatturato / ordini : 0;
    const prodottiMediPerOrdine = ordini > 0 ? prodotti / ordini : 0;

    const campaignData = {
      titolo: formData.titolo || `Campagna ${campaigns.length + 1}`,
      descrizione: formData.descrizione,
      budget,
      fatturato,
      ordini,
      prodotti,
      data: formData.data,
      roi,
      valore_medio_ordine: valoreMedioOrdine,
      prodotti_medi_per_ordine: prodottiMediPerOrdine
    };

    try {
      setIsLoading(true);
      await saveCampaignToSupabase(campaignData, productList);
      await loadCampaigns();
      
      // Reset form
      setFormData({
        titolo: '',
        descrizione: '',
        budget: '',
        fatturato: '',
        ordini: '',
        prodotti: '',
        data: new Date().toISOString().split('T')[0]
      });
      setProductList([]);
      
      toast({
        title: "Campagna salvata",
        description: `La campagna "${campaignData.titolo}" è stata salvata con successo`
      });
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast({
        title: "Errore nel salvataggio",
        description: "Impossibile salvare la campagna",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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
  const totalBudget = displayCampaigns.reduce((sum, campaign) => sum + campaign.budget, 0);
  const totalFatturato = displayCampaigns.reduce((sum, campaign) => sum + campaign.fatturato, 0);
  const totalOrdini = displayCampaigns.reduce((sum, campaign) => sum + campaign.ordini, 0);
  const overallROI = totalBudget > 0 ? ((totalFatturato - totalBudget) / totalBudget) * 100 : 0;
  const avgValoreMedioOrdine = totalOrdini > 0 ? totalFatturato / totalOrdini : 0;

  return (
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
                Monitora e analizza le tue campagne pubblicitarie con dati sempre aggiornati
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Budget Totale</CardTitle>
              <Euro className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">€{totalBudget.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Fatturato Totale</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">€{totalFatturato.toLocaleString()}</div>
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="campaigns">Campagne</TabsTrigger>
            <TabsTrigger value="products">Classifica Prodotti</TabsTrigger>
            {!isReadOnly && <TabsTrigger value="add">Aggiungi</TabsTrigger>}
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
                          <TableHead className="text-right">Budget</TableHead>
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
            <ProductLeaderboard campaigns={displayCampaigns} />
          </TabsContent>

          {!isReadOnly && (
            <TabsContent value="add" className="space-y-6">
              <Card className="bg-white shadow-lg max-w-4xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Aggiungi Nuova Campagna
                  </CardTitle>
                  <CardDescription>Inserisci i dati della tua campagna pubblicitaria</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="titolo">Titolo Campagna</Label>
                        <Input
                          id="titolo"
                          placeholder="es. Campagna Facebook Natale"
                          value={formData.titolo}
                          onChange={(e) => setFormData(prev => ({ ...prev, titolo: e.target.value }))}
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
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="descrizione">Descrizione della Campagna</Label>
                      <Textarea
                        id="descrizione"
                        placeholder="Descrivi la tua campagna pubblicitaria..."
                        value={formData.descrizione}
                        onChange={(e) => setFormData(prev => ({ ...prev, descrizione: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="budget">Budget Speso (€)</Label>
                        <Input
                          id="budget"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="1000.00"
                          value={formData.budget}
                          onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fatturato">Fatturato Generato (€)</Label>
                        <Input
                          id="fatturato"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="1500.00"
                          value={formData.fatturato}
                          onChange={(e) => setFormData(prev => ({ ...prev, fatturato: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ordini">Numero di Ordini</Label>
                        <Input
                          id="ordini"
                          type="number"
                          min="0"
                          placeholder="25"
                          value={formData.ordini}
                          onChange={(e) => setFormData(prev => ({ ...prev, ordini: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prodotti">Prodotti Venduti</Label>
                        <Input
                          id="prodotti"
                          type="number"
                          min="0"
                          placeholder="50"
                          value={formData.prodotti}
                          onChange={(e) => setFormData(prev => ({ ...prev, prodotti: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label>Prodotti Più Venduti</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Input
                          placeholder="Nome prodotto"
                          value={productInput.nome}
                          onChange={(e) => setProductInput(prev => ({ ...prev, nome: e.target.value }))}
                        />
                        <Input
                          type="number"
                          placeholder="Quantità"
                          value={productInput.quantita}
                          onChange={(e) => setProductInput(prev => ({ ...prev, quantita: e.target.value }))}
                        />
                        <Button type="button" onClick={addProduct}>
                          Aggiungi Prodotto
                        </Button>
                      </div>

                      {productList.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Prodotti aggiunti:</h4>
                          <div className="space-y-1">
                            {productList.map((product, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                <span>{product.nome} - Qtà: {product.quantita}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeProduct(index)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                      {isLoading ? 'Salvataggio...' : 'Salva Campagna'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
