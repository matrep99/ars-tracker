
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { AdRecord, saveAdRecord, getAllAdRecords, deleteAdRecord } from '@/lib/adStorage';
import { PerformanceCharts } from '@/components/PerformanceCharts';
import { RecordsTable } from '@/components/RecordsTable';
import { Plus, TrendingUp, DollarSign, ShoppingCart, Package } from 'lucide-react';

const Index = () => {
  const [records, setRecords] = useState<AdRecord[]>([]);
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [formData, setFormData] = useState({
    campaignName: '',
    budget: '',
    revenue: '',
    orders: '',
    products: '',
    date: new Date().toISOString().split('T')[0]
  });
  const { toast } = useToast();

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const allRecords = await getAllAdRecords();
      setRecords(allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      toast({
        title: "Error loading records",
        description: "Failed to load your advertising records",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const budget = parseFloat(formData.budget);
    const revenue = parseFloat(formData.revenue);
    const orders = parseInt(formData.orders);
    const products = parseInt(formData.products);

    if (budget < 0 || revenue < 0 || orders < 0 || products < 0) {
      toast({
        title: "Invalid values",
        description: "All values must be positive numbers",
        variant: "destructive"
      });
      return;
    }

    const roi = budget > 0 ? ((revenue - budget) / budget) * 100 : 0;
    const aov = orders > 0 ? revenue / orders : 0;
    const productsPerOrder = orders > 0 ? products / orders : 0;

    const newRecord: AdRecord = {
      id: Date.now().toString(),
      campaignName: formData.campaignName || `Campaign ${records.length + 1}`,
      budget,
      revenue,
      orders,
      products,
      date: formData.date,
      roi,
      aov,
      productsPerOrder,
      createdAt: new Date().toISOString()
    };

    try {
      await saveAdRecord(newRecord);
      await loadRecords();
      setFormData({
        campaignName: '',
        budget: '',
        revenue: '',
        orders: '',
        products: '',
        date: new Date().toISOString().split('T')[0]
      });
      setIsAddingRecord(false);
      toast({
        title: "Record added successfully",
        description: `Campaign "${newRecord.campaignName}" has been saved`
      });
    } catch (error) {
      toast({
        title: "Error saving record",
        description: "Failed to save the advertising record",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      await deleteAdRecord(id);
      await loadRecords();
      toast({
        title: "Record deleted",
        description: "The advertising record has been removed"
      });
    } catch (error) {
      toast({
        title: "Error deleting record",
        description: "Failed to delete the record",
        variant: "destructive"
      });
    }
  };

  const totalBudget = records.reduce((sum, record) => sum + record.budget, 0);
  const totalRevenue = records.reduce((sum, record) => sum + record.revenue, 0);
  const totalOrders = records.reduce((sum, record) => sum + record.orders, 0);
  const totalProducts = records.reduce((sum, record) => sum + record.products, 0);
  const overallROI = totalBudget > 0 ? ((totalRevenue - totalBudget) / totalBudget) * 100 : 0;
  const averageAOV = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Ad Performance Tracker</h1>
          <p className="text-lg text-gray-600">Track and analyze your advertising campaigns with real-time insights</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">${totalBudget.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Overall ROI</CardTitle>
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
              <CardTitle className="text-sm font-medium text-gray-600">Avg Order Value</CardTitle>
              <ShoppingCart className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">${averageAOV.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="records">Records</TabsTrigger>
            <TabsTrigger value="add">Add Record</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <PerformanceCharts records={records} />
          </TabsContent>

          <TabsContent value="records" className="space-y-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>All Records</CardTitle>
                <CardDescription>View and manage your advertising campaign records</CardDescription>
              </CardHeader>
              <CardContent>
                <RecordsTable records={records} onDelete={handleDeleteRecord} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add" className="space-y-6">
            <Card className="bg-white shadow-lg max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Campaign Record
                </CardTitle>
                <CardDescription>Enter your advertising campaign performance data</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="campaignName">Campaign Name</Label>
                      <Input
                        id="campaignName"
                        placeholder="e.g., Facebook Holiday Campaign"
                        value={formData.campaignName}
                        onChange={(e) => setFormData(prev => ({ ...prev, campaignName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="budget">Budget Spent ($)</Label>
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
                      <Label htmlFor="revenue">Revenue Generated ($)</Label>
                      <Input
                        id="revenue"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="1500.00"
                        value={formData.revenue}
                        onChange={(e) => setFormData(prev => ({ ...prev, revenue: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orders">Number of Orders</Label>
                      <Input
                        id="orders"
                        type="number"
                        min="0"
                        placeholder="25"
                        value={formData.orders}
                        onChange={(e) => setFormData(prev => ({ ...prev, orders: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="products">Products Sold</Label>
                      <Input
                        id="products"
                        type="number"
                        min="0"
                        placeholder="50"
                        value={formData.products}
                        onChange={(e) => setFormData(prev => ({ ...prev, products: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    Add Record
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
