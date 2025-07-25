// cestas-cafe/app/admin/pedidos/estatisticas/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { subDays, startOfWeek, startOfMonth, startOfYear, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Calendar as CalendarIcon, Loader2, ListOrdered, Utensils, Grape, PieChart as PieChartIcon } from 'lucide-react';
import { toast } from 'sonner';

interface StatItem {
    name: string;
    value: number;
}

// Interface de dados atualizada para corresponder à nova API
interface StatsData {
    totalPedidos: number;
    totalItensVendidos: number;
    itensMaisPedidos: StatItem[];
    pratosQuentesMaisPedidos: StatItem[];
    saboresMaisPedidos: StatItem[]; // Alterado
    categoriasMaisConsumidas: StatItem[];
}

const initialDateRange = {
    from: subDays(new Date(), 29),
    to: new Date(),
};

const CHART_COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", "#00C49F", "#FFBB28"];

export default function EstatisticasPage() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [date, setDate] = useState<DateRange | undefined>(initialDateRange);

    useEffect(() => {
        const fetchStats = async () => {
            if (!date?.from || !date?.to) return;
            setIsLoading(true);
            try {
                const params = new URLSearchParams({
                    startDate: date.from.toISOString(),
                    endDate: date.to.toISOString(),
                });
                const response = await fetch(`/api/admin/stats?${params.toString()}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Falha ao buscar estatísticas.');
                }
                const data: StatsData = await response.json();
                setStats(data);
            } catch (error: any) {
                toast.error(error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [date]);

    const setPresetDateRange = (preset: 'semanal' | 'mensal' | 'anual') => {
        const today = new Date();
        let fromDate: Date;
        if (preset === 'semanal') fromDate = startOfWeek(today, { locale: ptBR });
        else if (preset === 'mensal') fromDate = startOfMonth(today);
        else fromDate = startOfYear(today);
        setDate({ from: fromDate, to: today });
    };

    const renderBarChart = (data: StatItem[], title: string, icon: React.ReactNode) => (
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg font-semibold">{icon} {title}</CardTitle></CardHeader>
            <CardContent>
                {data && data.length > 0 ? (
                    <ChartContainer config={{}} className="h-[300px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} layout="vertical" margin={{ left: 30, right: 30, top: 5, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} interval={0} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                <Bar dataKey="value" fill="hsl(var(--primary))" radius={4} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                ) : ( <div className="flex items-center justify-center h-[300px]"><p className="text-muted-foreground">Nenhum dado para este período.</p></div> )}
            </CardContent>
        </Card>
    );
    
    // ================== INÍCIO DA CORREÇÃO ==================
    // A interface PieLabelProps foi removida e a função foi ajustada.
    const renderCustomizedLabel = (props: any) => {
        const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;

        // Adiciona uma verificação para garantir que as propriedades existam
        if ([cx, cy, midAngle, innerRadius, outerRadius, percent].some(p => p === undefined)) {
            return null;
        }

        // Não renderiza o label se a fatia for muito pequena (opcional, mas bom)
        if (percent === 0) {
            return null;
        }

        const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
        const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
        const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

        return (
            <text x={x} y={y} fill="currentColor" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };
    // =================== FIM DA CORREÇÃO ====================

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-card rounded-lg border">
                <div>
                    <h1 className="text-2xl font-bold">Análise de Consumo</h1>
                    <p className="text-muted-foreground">Selecione um período para analisar os dados de pedidos.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                    <Button variant="outline" size="sm" onClick={() => setPresetDateRange('semanal')}>Esta Semana</Button>
                    <Button variant="outline" size="sm" onClick={() => setPresetDateRange('mensal')}>Este Mês</Button>
                    <Button variant="outline" size="sm" onClick={() => setPresetDateRange('anual')}>Este Ano</Button>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button id="date" variant="outline" size="sm" className="w-[280px] justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (date.to ? `${format(date.from, "d 'de' LLL, y", {locale: ptBR})} - ${format(date.to, "d 'de' LLL, y", {locale: ptBR})}` : format(date.from, "d 'de' LLL, y")) : <span>Escolha um período</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} locale={ptBR} />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-96"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
            ) : !stats ? (
                <div className="flex justify-center items-center h-96"><p className="text-muted-foreground">Não foi possível carregar as estatísticas.</p></div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card><CardHeader><CardTitle>Total de Pedidos</CardTitle></CardHeader><CardContent><p className="text-4xl font-extrabold">{stats.totalPedidos}</p></CardContent></Card>
                        <Card><CardHeader><CardTitle>Itens Vendidos</CardTitle></CardHeader><CardContent><p className="text-4xl font-extrabold">{stats.totalItensVendidos}</p></CardContent></Card>
                    </div>

                    <div className="grid grid-cols-1 gap-6">{renderBarChart(stats.itensMaisPedidos, "Top 10 Itens Mais Pedidos", <ListOrdered />)}</div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {renderBarChart(stats.pratosQuentesMaisPedidos, "Top 5 Pratos Quentes", <Utensils />)}
                        {renderBarChart(stats.saboresMaisPedidos, "Top 5 Sabores", <Grape />)}
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2 text-lg font-semibold"><PieChartIcon /> Categorias Populares</CardTitle></CardHeader>
                            <CardContent>
                                {stats.categoriasMaisConsumidas && stats.categoriasMaisConsumidas.length > 0 ? (
                                    <ChartContainer config={{}} className="h-[300px] w-full">
                                         <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                                <Pie data={stats.categoriasMaisConsumidas} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={100} paddingAngle={2} labelLine={false} label={renderCustomizedLabel}>
                                                    {stats.categoriasMaisConsumidas.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </ChartContainer>
                                ) : ( <div className="flex items-center justify-center h-[300px]"><p className="text-muted-foreground">Nenhum dado para este período.</p></div> )}
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}