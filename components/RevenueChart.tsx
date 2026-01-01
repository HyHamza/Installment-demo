'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartProps {
    data: { date: string, daily_total: number }[];
}

export function RevenueChart({ data }: ChartProps) {
    const chartData = {
        labels: data.map(d => {
            const date = new Date(d.date);
            return `${date.getDate()}/${date.getMonth()+1}`;
        }),
        datasets: [
            {
                label: 'Daily Collection',
                data: data.map(d => d.daily_total),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                }
            },
            x: {
                grid: {
                    display: false,
                }
            }
        },
        maintainAspectRatio: false,
    };

    return (
        <div className="h-[300px] w-full">
            <Line options={options} data={chartData} />
        </div>
    );
}
