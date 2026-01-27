import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
} from '@tanstack/react-table';

type Call = {
    id: number;
    caller_name: string;
    caller_phone: string;
    caller_gender: string | null;
    region: { name: string } | null;
    department: { name: string } | null;
    question: string;
    solution: string | null;
    notes: string | null;
    status: string;
    created_at: string;
    duration_seconds: number | null;
    script: { question: string; answer: string | null; is_custom: boolean } | null;
};

const columnHelper = createColumnHelper<Call>();

const columns = [
    columnHelper.accessor('id', {
        header: 'ID',
        cell: (info) => <span className="text-muted-foreground">#{info.getValue()}</span>,
    }),
    columnHelper.accessor('created_at', {
        header: 'Date',
        cell: (info) => format(new Date(info.getValue()), 'dd.MM.yyyy HH:mm'),
    }),
    columnHelper.accessor('caller_name', {
        header: 'Caller',
        cell: (info) => (
            <div className="flex flex-col">
                <span className="font-medium">{info.getValue()}</span>
                {info.row.original.caller_phone && (
                    <span className="text-xs text-muted-foreground">{info.row.original.caller_phone}</span>
                )}
            </div>
        ),
    }),
    columnHelper.accessor('question', {
        header: 'Question',
        cell: (info) => (
            <div className="max-w-[200px] truncate" title={info.getValue()}>
                {info.getValue()}
            </div>
        ),
    }),
    columnHelper.display({
        id: 'solution',
        header: 'Solution',
        cell: (info) => {
            const script = info.row.original.script;
            const notes = info.row.original.notes;
            if (script?.answer) {
                return (
                    <div className="max-w-[200px] truncate text-green-700" title={script.answer}>
                        {script.answer}
                    </div>
                );
            }
            if (notes) {
                return (
                    <div className="max-w-[200px] truncate text-blue-600" title={notes}>
                        📝 {notes}
                    </div>
                );
            }
            return <span className="text-muted-foreground">-</span>;
        },
    }),
    columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
            <Badge variant={info.getValue() === 'closed' ? 'secondary' : 'default'}>
                {info.getValue()}
            </Badge>
        ),
    }),
    columnHelper.accessor('duration_seconds', {
        header: 'Duration',
        cell: (info) => {
            const val = info.getValue();
            if (val === null) return '-';
            const mins = Math.floor(val / 60);
            const secs = val % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        },
    }),
];

export default function HistoryPage() {
    const { data: calls, isLoading, isError } = useQuery({
        queryKey: ['calls', 'history'],
        queryFn: async () => {
            const response = await api.get('/calls/?limit=100'); // TODO: Pagination
            return response.data;
        },
    });

    const table = useReactTable({
        data: calls || [],
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-center text-destructive py-10">
                Failed to load call history.
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Call History</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && 'selected'}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center"
                                    >
                                        No results.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
