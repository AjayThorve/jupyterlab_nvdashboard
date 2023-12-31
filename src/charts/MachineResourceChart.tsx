import React, { useState, useEffect } from 'react';
import { ReactWidget, Button } from '@jupyterlab/ui-components';
import { Line, XAxis, YAxis, Brush, LineChart } from 'recharts';
import AutoSizer from 'react-virtualized-auto-sizer';
import { requestAPI } from '../handler';
import { CustomLineChart } from '../components/customLineChart';
import { formatDate, formatBytes } from '../components/formatUtils';

interface IChartProps {
  time: number;
  cpu_utilization: number;
  memory_usage: number;
  disk_read: number;
  disk_write: number;
  network_read: number;
  network_write: number;
  disk_read_current: number;
  disk_write_current: number;
  network_read_current: number;
  network_write_current: number;
}

const MachineResourceChart = () => {
  const [cpuData, setCpuData] = useState<IChartProps[]>([]);
  const [tempData, setTempData] = useState<IChartProps[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    async function fetchCpuUsage() {
      let response = await requestAPI<IChartProps>('cpu_resource');

      if (cpuData.length > 0) {
        response = {
          ...response,
          disk_read_current:
            response.disk_read - cpuData[cpuData.length - 1].disk_read,
          disk_write_current:
            response.disk_write - cpuData[cpuData.length - 1].disk_write,
          network_read_current:
            response.network_read - cpuData[cpuData.length - 1].network_read,
          network_write_current:
            response.network_write - cpuData[cpuData.length - 1].network_write
        };
      }
      if (!isPaused) {
        setCpuData(prevData => {
          if (tempData.length > 1) {
            prevData = [...prevData, ...tempData];
          }
          const newData = [...prevData, response];
          return newData;
        });
        setTempData([]);
      } else {
        setTempData([...tempData, response]);
      }
    }

    const interval = setInterval(fetchCpuUsage, 1000);

    return () => clearInterval(interval);
  }, [isPaused, tempData]);

  const handlePauseClick = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="gradient-background">
      <div style={{ width: '100%', height: '20px' }}>
        <Button
          onClick={handlePauseClick}
          className="gpu-dashboard-toolbar-button"
        >
          {isPaused ? 'Resume' : 'Pause'}
        </Button>
      </div>
      <AutoSizer>
        {({ height, width }: { height: number; width: number }) => (
          <div style={{ width, height }}>
            <CustomLineChart
              data={cpuData}
              title={'CPU Utilization [%]'}
              yDomain={[0, 100]}
              xFormatter={formatDate}
              yFormatter={value => `${value}%`}
              width={width}
              height={height / 5}
              syncId="cpu-resource-sync"
            >
              <Line
                dataKey={'cpu_utilization'}
                name={'CPU Utilization'}
                stroke={'hsl(0, 100%, 50%)'}
                type="monotone"
                isAnimationActive={false}
              />
            </CustomLineChart>
            <CustomLineChart
              data={cpuData}
              title={'Memory Usage [B]'}
              xFormatter={formatDate}
              yFormatter={formatBytes}
              width={width}
              height={height / 5}
              syncId="cpu-resource-sync"
            >
              <Line
                dataKey={'memory_usage'}
                name={'Memory Usage'}
                stroke={'hsl(0, 100%, 50%)'}
                type="monotone"
                isAnimationActive={false}
              />
            </CustomLineChart>
            <CustomLineChart
              data={cpuData}
              title={'Disk I/O Bandwidth [B/s]'}
              xFormatter={formatDate}
              yFormatter={formatBytes}
              width={width}
              height={height / 5}
              syncId="cpu-resource-sync"
            >
              <Line
                dataKey={'disk_read_current'}
                name={'Disk Read'}
                stroke={'hsl(0, 100%, 50%)'}
                type="monotone"
                isAnimationActive={false}
              />
              <Line
                dataKey={'disk_write_current'}
                name={'Disk Write'}
                stroke={'hsl(90, 100%, 50%)'}
                type="monotone"
                isAnimationActive={false}
              />
            </CustomLineChart>
            <CustomLineChart
              data={cpuData}
              title={'Network I/O Bandwidth [B/s]'}
              xFormatter={formatDate}
              yFormatter={formatBytes}
              width={width}
              height={height / 5}
              syncId="cpu-resource-sync"
            >
              <Line
                dataKey={'network_read_current'}
                name={'Network Read'}
                stroke={'hsl(0, 100%, 50%)'}
                type="monotone"
                isAnimationActive={false}
              />
              <Line
                dataKey={'network_write_current'}
                name={'Network Write'}
                stroke={'hsl(90, 100%, 50%)'}
                type="monotone"
                isAnimationActive={false}
              />
            </CustomLineChart>
            <LineChart
              data={cpuData}
              width={width * 0.95}
              syncId="cpu-resource-sync"
              height={50}
              compact={true}
            >
              <XAxis dataKey="time" height={0} />
              <YAxis height={0} />
              <Brush
                dataKey={'time'}
                tickFormatter={formatDate}
                startIndex={Math.max(cpuData.length - 10, 0)}
                fill="none"
              />
            </LineChart>
          </div>
        )}
      </AutoSizer>
    </div>
  );
};

export class MachineResourceChartWidget extends ReactWidget {
  render() {
    return <MachineResourceChart />;
  }
}
