import type { Preview } from '@storybook/angular'
import { applicationConfig } from '@storybook/angular';
import { provideRouter, withDisabledInitialNavigation } from '@angular/router';
import { setCompodocJson } from "@storybook/addon-docs/angular";
import docJson from "../documentation.json";

// Ensure FEATURES exists to prevent TypeError inside extractArgTypesFromData
(globalThis as any).FEATURES = (globalThis as any).FEATURES || {};
if (typeof (globalThis as any).FEATURES.angularFilterNonInputControls === 'undefined') {
  (globalThis as any).FEATURES.angularFilterNonInputControls = true;
}

setCompodocJson(docJson);

const preview: Preview = {
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [provideRouter([], withDisabledInitialNavigation())]
    })
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      expanded: true,
    },
  },
};

export default preview;