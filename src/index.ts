import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  showDialog,
  Dialog
} from '@jupyterlab/apputils';

import {
  Cell
} from '@jupyterlab/cells';

import {
  INotebookTracker,
  NotebookTools
} from '@jupyterlab/notebook';

const PLUGIN = 'jupyterlab-reveal';
const FLAG = 'reveal';
const FLAG_HIDDEN = `${FLAG}-hidden`;
const CLASS = FLAG;
const CLASS_HIDDEN = `${CLASS}-hidden`;
const CLASS_HEADER = `${CLASS}-header`;

/**
 * Initialization data for the jupyterlab-reveal extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-reveal:plugin',
  autoStart: true,
  requires: [ INotebookTracker ],
  activate: (app: JupyterFrontEnd, tracker: INotebookTracker) => {
    const notebookTools = new NotebookTools({ tracker });

    function error(message: string) {
      showDialog({
        title: PLUGIN,
        body: message,
        buttons: [
          Dialog.okButton()
        ],
      }).catch(e => console.log(PLUGIN, 'dialog', e));
    }

    function syncCells(cells: readonly Cell[]) {
      const ishidden = new Map();
      cells.forEach(c => {
        const reveal = c.model.metadata.get(FLAG);
        if (typeof reveal == 'string') {
          const hidden = c.model.metadata.get(FLAG_HIDDEN);
          c.addClass(CLASS);
          if (typeof hidden == 'boolean') {
            // in the header cell
            ishidden.set(reveal, hidden);
            const header = c.node.querySelector('.jp-Cell-header');
            if (!header) return error('huh? no cell header!');
            const div = document.createElement('div');
            div.classList.add(CLASS_HEADER);
            header.appendChild(div);
          } else {
            // in a solution element
            if (ishidden.get(reveal)) {
              c.addClass(CLASS_HIDDEN);
            } else {
              c.removeClass(CLASS_HIDDEN);
            }
          }
        } else {
          c.removeClass(CLASS);
          c.removeClass(CLASS_HIDDEN);
          const classHeader = c.node.querySelector(`.jp-Cell-header > ${CLASS_HEADER}`);
          if (classHeader) classHeader.remove();
        }
      });
    }

    function generateId() {
      return Math.random().toString(36).substr(2);
    }

    function convert(cells: readonly Cell[]) {
      let id = '';

      // exercise2
      cells.forEach((c, i) => {
	if (c.model.metadata.get('solution2_first')) {
          c.model.metadata.delete('solution2_first');
          id = generateId();
          c.model.metadata.set(FLAG, id);	// guard
          c.model.metadata.set(FLAG_HIDDEN, false);
        }
	if (c.model.metadata.get('solution2')) {
          c.model.metadata.delete('solution2');
          c.model.metadata.set(FLAG, id);
        }
      });

//      // @rmotr/jupyterlab-solutions
//      cells.forEach(c => {
//        if (c.model.metadata.get('is_solution')) {
//          c.model.metadata.set(FLAG, true);
//        }
//      });
    }

    app.commands.addCommand(`${PLUGIN}:toggle`, {
      label: 'Toggle Solution',
      caption: 'Toggle runs of selected cells as the solution.',
      execute: () => {
        const { activeNotebookPanel, selectedCells } = notebookTools;
        if (!activeNotebookPanel) return error('huh? nothing active!');

        const { content } = activeNotebookPanel;
        const { widgets: cells } = content;

	const id = generateId();
        const reveal = selectedCells.some(w => w.model.metadata.has(FLAG));
        selectedCells.forEach((w, i) => {
          if (reveal) {
            w.model.metadata.delete(FLAG);
            w.model.metadata.delete(FLAG_HIDDEN);
          } else {
            w.model.metadata.set(FLAG, id);
            if (i == 0) {
              w.model.metadata.set(FLAG_HIDDEN, false);
            } else {
              w.model.metadata.delete(FLAG_HIDDEN);
            }
          }
        });

        // all cells incase someone splits some by accident
        syncCells(cells);
      }
    });

    app.contextMenu.addItem({
      command: `${PLUGIN}:toggle`,
      selector: '.jp-Cell',
      rank: 30
    });

    tracker.currentChanged.connect((tracker, viewer) => {
      if (!viewer) return;
      const cells = viewer.content.widgets;
      convert(cells);
      syncCells(cells);
    });
  }
};

export default plugin;
