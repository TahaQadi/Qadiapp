
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { BarChart, LineChart, PieChart } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Package, Users } from 'lucide-react';
import { useLanguage } from './LanguageProvider';
import { cn } from '@/lib/utils';

interface MobileAnalyticsDashboardProps {
  data: any;
}

export function MobileAnalyticsDashboard({ data }: MobileAnalyticsDashboardProps) {
  const { t } = useLanguage();

  const stats = [
    {
      title: t('analytics.totalOrders'),
      value: data?.totalOrders || 0,
      icon: Package,
      trend: data?.ordersTrend || 0,
      color: 'text-blue-500',
    },
    {
      title: t('analytics.totalRevenue'),
      value: `$${(data?.totalRevenue || 0).toFixed(2)}`,
      icon: DollarSign,
      trend: data?.revenueTrend || 0,
      color: 'text-green-500',
    },
    {
      title: t('analytics.activeClients'),
      value: data?.activeClients || 0,
      icon: Users,
      trend: data?.clientsTrend || 0,
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="space-y-4 pb-20">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isPositive = stat.trend >= 0;

          return (
            <Card key={stat.title}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-mobile-xs text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-mobile-xl font-bold">
                      {stat.value}
                    </p>
                    <div className="flex items-center gap-1 text-mobile-xs">
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                      <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
                        {Math.abs(stat.trend)}%
                      </span>
                      <span className="text-muted-foreground">
                        {t('analytics.vsLastMonth')}
                      </span>
                    </div>
                  </div>
                  <Icon className={cn('h-10 w-10', stat.color)} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-mobile-lg">{t('analytics.trends')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="w-full justify-start px-4 overflow-x-auto">
              <TabsTrigger value="orders" className="text-mobile-sm">
                {t('analytics.orders')}
              </TabsTrigger>
              <TabsTrigger value="revenue" className="text-mobile-sm">
                {t('analytics.revenue')}
              </TabsTrigger>
              <TabsTrigger value="products" className="text-mobile-sm">
                {t('analytics.topProducts')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="p-4">
              <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
                <p className="text-mobile-sm text-muted-foreground">
                  {t('analytics.chartPlaceholder')}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="revenue" className="p-4">
              <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
                <p className="text-mobile-sm text-muted-foreground">
                  {t('analytics.chartPlaceholder')}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="products" className="p-4">
              <div className="space-y-3">
                {(data?.topProducts || []).map((product: any, index: number) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-mobile-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-mobile-sm">{product.name}</p>
                        <p className="text-mobile-xs text-muted-foreground">
                          {product.orders} {t('analytics.orders')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-mobile-sm">${product.revenue}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
