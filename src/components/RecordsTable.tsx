
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdRecord } from '@/lib/adStorage';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface RecordsTableProps {
  records: AdRecord[];
  onDelete: (id: string) => void;
}

export const RecordsTable = ({ records, onDelete }: RecordsTableProps) => {
  if (records.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No records found. Add your first campaign record to get started!</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Campaign</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Budget</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Orders</TableHead>
            <TableHead className="text-right">Products</TableHead>
            <TableHead className="text-right">ROI</TableHead>
            <TableHead className="text-right">AOV</TableHead>
            <TableHead className="text-right">Prod/Order</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id} className="hover:bg-gray-50">
              <TableCell className="font-medium">{record.campaignName}</TableCell>
              <TableCell>{format(new Date(record.date), 'MMM dd, yyyy')}</TableCell>
              <TableCell className="text-right">${record.budget.toLocaleString()}</TableCell>
              <TableCell className="text-right">${record.revenue.toLocaleString()}</TableCell>
              <TableCell className="text-right">{record.orders}</TableCell>
              <TableCell className="text-right">{record.products}</TableCell>
              <TableCell className="text-right">
                <Badge 
                  variant={record.roi >= 0 ? "default" : "destructive"}
                  className={record.roi >= 0 ? "bg-green-100 text-green-800" : ""}
                >
                  {record.roi.toFixed(1)}%
                </Badge>
              </TableCell>
              <TableCell className="text-right">${record.aov.toFixed(2)}</TableCell>
              <TableCell className="text-right">{record.productsPerOrder.toFixed(1)}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(record.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
