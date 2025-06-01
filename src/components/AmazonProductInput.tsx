
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus } from 'lucide-react';

interface Product {
  nome: string;
  quantita: number;
  fatturato_prodotto?: number;
}

interface AmazonProductInputProps {
  products: Product[];
  onProductsChange: (products: Product[]) => void;
}

export const AmazonProductInput = ({ products, onProductsChange }: AmazonProductInputProps) => {
  const [productForm, setProductForm] = useState({
    nome: '',
    quantita: '',
    fatturato_prodotto: ''
  });

  const addProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productForm.nome || !productForm.quantita) return;
    
    const newProduct: Product = {
      nome: productForm.nome,
      quantita: parseInt(productForm.quantita),
      fatturato_prodotto: productForm.fatturato_prodotto ? parseFloat(productForm.fatturato_prodotto) : undefined
    };

    onProductsChange([...products, newProduct]);
    setProductForm({ nome: '', quantita: '', fatturato_prodotto: '' });
  };

  const removeProduct = (index: number) => {
    onProductsChange(products.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="font-medium mb-3">Aggiungi Prodotti Venduti</h4>
        <form onSubmit={addProduct} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="product-name">Nome Prodotto</Label>
              <Input
                id="product-name"
                value={productForm.nome}
                onChange={(e) => setProductForm(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="es. iPhone 15"
                required
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
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="product-revenue">Fatturato Prodotto (€) - Opzionale</Label>
              <Input
                id="product-revenue"
                type="number"
                step="0.01"
                min="0"
                value={productForm.fatturato_prodotto}
                onChange={(e) => setProductForm(prev => ({ ...prev, fatturato_prodotto: e.target.value }))}
                placeholder="1000.00"
              />
            </div>
          </div>
          <Button type="submit" size="sm" className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi Prodotto
          </Button>
        </form>
      </div>

      {products.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prodotto</TableHead>
                <TableHead className="text-right">Quantità</TableHead>
                <TableHead className="text-right">Fatturato</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{product.nome}</TableCell>
                  <TableCell className="text-right">{product.quantita}</TableCell>
                  <TableCell className="text-right">
                    {product.fatturato_prodotto ? `€${product.fatturato_prodotto.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProduct(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
