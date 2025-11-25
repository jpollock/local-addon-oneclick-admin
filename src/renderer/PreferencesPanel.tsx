/**
 * Preferences Panel for Auto One-Click Admin.
 * IMPORTANT: Must be a React class component (no hooks allowed in Local addons).
 *
 * @module renderer/PreferencesPanel
 */

import { ADDON_NAME, IPC_CHANNELS } from '../common/constants';
import type {
  PreferencesPanelProps,
  PreferencesPanelState,
  IPCResponse,
  SettingsData,
  ComponentContext,
} from '../common/types';

// Get React Component base class
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getReactComponent = (): any => {
  if (typeof React !== 'undefined' && React.Component) {
    return React.Component;
  }
  // Fallback to require
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ReactModule = require('react');
  return ReactModule.Component;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BaseComponent: any = getReactComponent();

// React type declaration
declare const React: typeof import('react');

/**
 * Extended window interface for electron access.
 */
interface WindowWithElectron extends Window {
  electron?: ComponentContext['electron'];
}

/**
 * Gets electron API from context or window.
 *
 * @param context - Component context
 * @returns Electron API or null
 */
function getElectron(context: ComponentContext): ComponentContext['electron'] | null {
  const win = window as WindowWithElectron;
  return context.electron ?? win.electron ?? null;
}

/**
 * Preferences panel component for the Auto One-Click Admin addon.
 * Displays a toggle to enable/disable automatic one-click admin configuration.
 */
export class PreferencesPanel extends BaseComponent<PreferencesPanelProps, PreferencesPanelState> {
  /**
   * Creates a new PreferencesPanel instance.
   *
   * @param props - Component props
   */
  constructor(props: PreferencesPanelProps) {
    super(props);
    this.state = {
      enabled: true,
      loading: true,
      error: null,
    };
  }

  /**
   * Called when the component mounts.
   * Loads current settings from main process.
   */
  componentDidMount(): void {
    this.loadSettings();
    // Disable Apply button until user makes changes
    if (this.props.setApplyButtonDisabled) {
      this.props.setApplyButtonDisabled(true);
    }
  }

  /**
   * Loads settings from the main process via IPC.
   */
  loadSettings = async (): Promise<void> => {
    const { context } = this.props;
    const electron = getElectron(context);

    if (!electron) {
      this.setState({ loading: false, error: 'Electron not available' });
      return;
    }

    try {
      const response: IPCResponse<SettingsData> = await electron.ipcRenderer.invoke(
        IPC_CHANNELS.GET_SETTINGS
      );

      if (response.success && response.data) {
        this.setState({
          enabled: response.data.enabled,
          loading: false,
        });

        // Notify parent of initial settings
        if (this.props.onSettingsChange) {
          this.props.onSettingsChange({ enabled: response.data.enabled });
        }
      } else {
        this.setState({
          loading: false,
          error: response.error ?? 'Failed to load settings',
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[${ADDON_NAME}] Failed to load settings:`, error);
      this.setState({
        loading: false,
        error: errorMessage,
      });
    }
  };

  /**
   * Handles toggle checkbox changes.
   *
   * @param e - Change event from checkbox
   */
  handleToggle = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const enabled = e.target.checked;

    this.setState({
      enabled,
      error: null,
    });

    // Enable Apply button when changes are made
    if (this.props.setApplyButtonDisabled) {
      this.props.setApplyButtonDisabled(false);
    }

    // Notify parent of changes
    if (this.props.onSettingsChange) {
      this.props.onSettingsChange({ enabled });
    }
  };

  /**
   * Renders the preferences panel.
   *
   * @returns React element
   */
  render(): React.ReactElement {
    const { React: ReactLib } = this.props.context;
    const { enabled, loading, error } = this.state;

    if (loading) {
      return ReactLib.createElement(
        'div',
        {
          style: { padding: '20px', textAlign: 'center' as const },
        },
        'Loading settings...'
      );
    }

    return ReactLib.createElement(
      'div',
      {
        className: 'oneclick-admin-preferences',
        style: {
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          margin: '20px 0',
        },
      },
      // Header
      ReactLib.createElement(
        'h3',
        {
          style: { marginTop: 0, marginBottom: '20px' },
        },
        'Auto One-Click Admin Settings'
      ),

      // Description
      ReactLib.createElement(
        'p',
        {
          style: { marginBottom: '20px', color: '#666' },
        },
        'When enabled, this addon automatically configures one-click admin ' +
          'for all new sites using the first administrator user.'
      ),

      // Error display
      error &&
        ReactLib.createElement(
          'div',
          {
            style: {
              padding: '10px 15px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '4px',
              marginBottom: '20px',
              color: '#856404',
            },
          },
          error
        ),

      // Settings form
      ReactLib.createElement(
        'div',
        {
          style: { backgroundColor: 'white', padding: '20px', borderRadius: '4px' },
        },
        // Enable toggle
        ReactLib.createElement(
          'label',
          {
            style: {
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none' as const,
            },
          },
          ReactLib.createElement('input', {
            type: 'checkbox',
            checked: enabled,
            onChange: this.handleToggle,
            style: { marginRight: '12px', width: '18px', height: '18px' },
          }),
          ReactLib.createElement(
            'span',
            {
              style: { fontSize: '14px' },
            },
            'Automatically enable one-click admin for new sites'
          )
        ),

        // Help text
        ReactLib.createElement(
          'p',
          {
            style: {
              marginTop: '10px',
              marginBottom: 0,
              marginLeft: '30px',
              fontSize: '13px',
              color: '#888',
            },
          },
          'Applies to newly created, imported, and cloned sites. ' +
            'Existing sites are not affected.'
        )
      ),

      // Info box
      ReactLib.createElement(
        'div',
        {
          style: {
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#e7f3ff',
            border: '1px solid #b3d7ff',
            borderRadius: '4px',
            fontSize: '13px',
          },
        },
        ReactLib.createElement('strong', null, 'How it works: '),
        'When a new site is created, this addon waits for the site to start, ' +
          'then uses WP-CLI to find the first administrator user and configures ' +
          'one-click admin with that user.'
      )
    );
  }
}
