"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  Legend,
} from "recharts";

export default function AnalyticsChart({ data = [] }) {
  if (!data.length) {
    return (
      <div className="h-96 w-full rounded-lg border border-white/10 bg-black/20 grid place-items-center text-white/40">
        Gráfico (sin datos)
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full rounded-lg border border-white/10 bg-black/20 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 40, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis
            dataKey="day"
            tickFormatter={(value) => {
              const date = new Date(value);
              const options = { day: "numeric", month: "short" };
              return date.toLocaleDateString("es-ES", options);
            }}
            stroke="rgba(255,255,255,0.4)"
            fontSize={12}
          />
          <YAxis
            stroke="rgba(255,255,255,0.4)"
            fontSize={12}
            tickFormatter={(value) => `$${value.toLocaleString("es-AR")}`}
          />
          <Tooltip
            contentStyle={{
              background: "#111",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
              color: "#fff",
            }}
            labelFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
            }}
            formatter={(value, name) =>
              name === "money"
                ? [`$${value.toLocaleString("es-AR")}`, "Ingresos 💰"]
                : [value, "Chats 💬"]
            }
          />
          <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ color: "#fff" }} />
          <Area
            type="monotone"
            dataKey="money"
            stroke="#10b981"
            fill="rgba(16,185,129,0.25)"
            strokeWidth={2}
            name="Ingresos 💰"
          />
          <Line
            type="monotone"
            dataKey="chats"
            stroke="#facc15"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name="Chats 💬"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}



