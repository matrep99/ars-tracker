import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CampaignRecord, Product, saveCampaign, getAllCampaigns, deleteCampaign } from '@/lib/campaignStorage';
import { CampaignCharts } from '@/components/CampaignCharts';
import { ProductRanking } from '@/components/ProductRanking';
import { DataSharing } from '@/components/DataSharing';
import { PasswordProtection } from '@/components/PasswordProtection';
import { Plus, TrendingUp, Euro, ShoppingCart, Package, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [sharedData, setSharedData] = useState<CampaignRecord[] | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
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
  const [productList, setProductList] = useState<Product[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Check for shared data in URL
    const urlParams = new URLSearchParams(window.location.search);
    const sharedId = urlParams.get('shared');
    const encodedData = urlParams.get('data');
    
    if (sharedId || encodedData) {
      setIsReadOnly(true);
      if (encodedData) {
        try {
          const decodedData = JSON.parse(atob(encodedData));
          setSharedData(decodedData.campaigns || []);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Errore nel caricamento dei dati condivisi:', error);
        }
      }
      return;
    }

    // Check authentication
    const isAuth = localStorage.getItem('app_authenticated') === 'true';
    if (isAuth) {
      setIsAuthenticated(true);
      loadCampaigns();
    }
  }, []);

  const loadCampaigns = async () => {
    try {
      const allCampaigns = await getAllCampaigns();
      setCampaigns(allCampaigns.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()));
    } catch (error) {
      toast({
        title: "Errore nel caricamento",
        description: "Impossibile caricare le campagne salvate",
        variant: "destructive"
      });
    }
  };

  const addProduct = () => {
    if (productInput.nome && productInput.quantita) {
      const newProduct: Product = {
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

    const newCampaign: CampaignRecord = {
      id: Date.now().toString(),
      titolo: formData.titolo || `Campagna ${campaigns.length + 1}`,
      descrizione: formData.descrizione,
      budget,
      fatturato,
      ordini,
      prodotti,
      prodottiVenduti: productList,
      data: formData.data,
      roi,
      valoreMedioOrdine,
      prodottiMediPerOrdine,
      creatoIl: new Date().toISOString()
    };

    try {
      await saveCampaign(newCampaign);
      await loadCampaigns();
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
        description: `La campagna "${newCampaign.titolo}" è stata salvata con successo`
      });
    } catch (error) {
      toast({
        title: "Errore nel salvataggio",
        description: "Impossibile salvare la campagna",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      await deleteCampaign(id);
      await loadCampaigns();
      toast({
        title: "Campagna eliminata",
        description: "La campagna è stata rimossa con successo"
      });
    } catch (error) {
      toast({
        title: "Errore nell'eliminazione",
        description: "Impossibile eliminare la campagna",
        variant: "destructive"
      });
    }
  };

  if (!isAuthenticated) {
    return <PasswordProtection onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  const displayCampaigns = sharedData || campaigns;
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
                Monitora e analizza le tue campagne pubblicitarie con grafici interattivi
              </p>
            </div>
          </div>
        </div>

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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="campaigns">Campagne</TabsTrigger>
            <TabsTrigger value="products">Prodotti</TabsTrigger>
            {!isReadOnly && <TabsTrigger value="add">Aggiungi</TabsTrigger>}
            {!isReadOnly && <TabsTrigger value="share">Condividi</TabsTrigger>}
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
                          {!isReadOnly && <TableHead className="w-[100px]">Azioni</TableHead>}
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
                            <TableCell className="text-right">€{campaign.valoreMedioOrdine.toFixed(2)}</TableCell>
                            {!isReadOnly && (
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteCampaign(campaign.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            )}
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
            <ProductRanking campaigns={displayCampaigns} />
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

                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                      Salva Campagna
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {!isReadOnly && (
            <TabsContent value="share" className="space-y-6">
              <DataSharing campaigns={campaigns} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
