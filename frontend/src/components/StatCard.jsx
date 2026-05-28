import { motion } from 'framer-motion';
import { Card, CardContent } from './ui/card';

export function StatCard({ title, value, icon: Icon }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 text-3xl font-semibold">{value}</p>
          </div>
          {Icon && <Icon className="h-8 w-8 text-primary" />}
        </CardContent>
      </Card>
    </motion.div>
  );
}
