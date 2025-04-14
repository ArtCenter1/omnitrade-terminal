import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

type AllocationChartProps = {
  data: Array<{ name: string; value: number; color: string }>;
  className?: string;
};

export function AllocationChart({
  data = [],
  className = "pie-chart-container",
}: AllocationChartProps) {
  // Ensure we have valid data before rendering the chart
  if (!data || data.length === 0) {
    return <div className={className}>No allocation data</div>;
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#111",
              borderColor: "#333",
              borderRadius: "4px",
            }}
            itemStyle={{ color: "#fff" }}
            formatter={(value: number) => [
              `${value.toFixed(2)}%`,
              "Allocation",
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
