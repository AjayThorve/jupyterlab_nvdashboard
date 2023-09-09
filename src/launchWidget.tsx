import React from 'react';
import { ILabShell, JupyterFrontEnd } from '@jupyterlab/application';
import { ReactWidget, Button } from '@jupyterlab/ui-components';
import {
  GpuResourceChartWidget,
  GpuUsageChartWidget,
  GpuUtilizationChartWidget
} from './charts';
import { MainAreaWidget, WidgetTracker } from '@jupyterlab/apputils';
import { gpuIcon } from './assets/icons';

interface IControlProps {
  app: JupyterFrontEnd;
  labShell: ILabShell;
  tracker: WidgetTracker;
}

export interface IWidgetInfo {
  id: string;
  title: string;
  instance: MainAreaWidget;
}

// Control component for the GPU Dashboard, which contains buttons to open the GPU widgets
const Control: React.FC<IControlProps> = ({ app, labShell, tracker }) => {
  // Keep track of open widgets
  const openWidgets: IWidgetInfo[] = [];
  console.log(tracker);

  // Add command to open GPU Dashboard Widget
  app.commands.addCommand('gpu-dashboard-widget:open', {
    label: 'Open GPU Dashboard Widget',
    execute: args => {
      const { id, title } = args as { id: string; title: string };
      const w = tracker.find(widget => widget.id === id);
      if (w) {
        if (!w.isAttached) {
          labShell.add(w, 'main');
        }
        labShell.activateById(w.id);
        return;
      }
      openWidgetById(id, title);
    }
  });

  /* Function to create a widget by id and title and add it to the main area,
   or bring it to the front if it is already open */
  const openWidget = (
    widgetCreator: () => ReactWidget,
    id: string,
    title: string
  ) => {
    // Check if a widget with the same id is already open
    const existingWidget = tracker.find(widget => widget.id === id);
    if (existingWidget) {
      // If widget is already open, bring it to the front
      labShell.activateById(existingWidget.id);
    } else {
      // If widget is not open, create and add it
      const content = widgetCreator();
      const widgetInstance = new MainAreaWidget({ content });
      widgetInstance.title.label = title;
      widgetInstance.title.icon = gpuIcon;
      widgetInstance.id = id;
      app.shell.add(widgetInstance, 'main');
      tracker.add(widgetInstance);
      openWidgets.push({ id, title, instance: widgetInstance });

      // Remove the widget from openWidgets when it is closed
      widgetInstance.disposed.connect(() => {
        const index = openWidgets.findIndex(widget => widget.id === id);
        if (index !== -1) {
          openWidgets.splice(index, 1);
        }
      });
    }
  };

  // Function to open a widget by id and title (used by buttons)
  const openWidgetById = (id: string, title: string) => {
    let widgetFunction;
    console.log(id);
    switch (id) {
      case 'gpu-usage-widget':
        widgetFunction = () => new GpuUsageChartWidget();
        break;
      case 'gpu-utilization-widget':
        widgetFunction = () => new GpuUtilizationChartWidget();
        break;
      case 'gpu-resource-widget':
        widgetFunction = () => new GpuResourceChartWidget();
        break;
      default:
        return;
    }
    openWidget(widgetFunction, id, title);
  };

  return (
    <div className="gpu-dashboard-container">
      <div className="gpu-dashboard-header">GPU Dashboards</div>
      <hr className="gpu-dashboard-divider" />
      <Button
        className="gpu-dashboard-button"
        onClick={() => openWidgetById('gpu-usage-widget', 'GPU Memory')}
      >
        Open GPU Usage Widget
      </Button>
      <Button
        className="gpu-dashboard-button"
        onClick={() =>
          openWidgetById('gpu-utilization-widget', 'GPU Utilization')
        }
      >
        Open GPU Utilization Widget
      </Button>
      <Button
        className="gpu-dashboard-button"
        onClick={() => openWidgetById('gpu-resource-widget', 'GPU Resources')}
      >
        Open GPU Resources Widget
      </Button>
    </div>
  );
};

export class ControlWidget extends ReactWidget {
  constructor(
    private app: JupyterFrontEnd,
    private labShell: ILabShell,
    private tracker: WidgetTracker
  ) {
    super();
    this.tracker = tracker;
  }

  render(): JSX.Element {
    return (
      <Control app={this.app} labShell={this.labShell} tracker={this.tracker} />
    );
  }
}
