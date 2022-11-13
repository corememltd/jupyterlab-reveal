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

const CLASS = `${FLAG}Plugin`;
const CLASS_BUTTON = `${CLASS}-button`;
const CLASS_HIDDEN = `${CLASS}-hidden`;

/**
 * Initialization data for the jupyterlab-reveal extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: `${PLUGIN}:plugin`,
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

    function sync(cells: readonly Cell[]) {
      const ishidden = new Map();

      function addHeader(cell: Cell) {
        const footer = cell.node.querySelector('.jp-Cell-footer');
        if (!footer) return error('huh? no cell footer!');
        if (footer.querySelector(`.${CLASS_BUTTON}`)) return;

        const id = cell.model.metadata.get(FLAG);
        let hidden = cell.model.metadata.get(FLAG_HIDDEN);

        const div = document.createElement('div');
        div.classList.add(CLASS_BUTTON);

        const button = document.createElement('button');
        button.innerText = `${hidden ? 'Reveal' : 'Hide'} solution`;
        button.addEventListener('click', e => {
          // unable to use parent on the cell
          const { activeNotebookPanel } = notebookTools;
          if (!activeNotebookPanel) return error('huh? no active notebook panel!');

          const { content } = activeNotebookPanel;
          const { widgets: cells } = content;

          hidden = !hidden;
          cell.model.metadata.set(FLAG_HIDDEN, hidden);

          button.innerText = `${hidden ? 'Reveal' : 'Hide'} solution`;

          cells.filter(c => c.model.metadata.get(FLAG) == id).slice(1).forEach(c => {
            if (hidden) {
              c.addClass(CLASS_HIDDEN);
            } else {
              c.removeClass(CLASS_HIDDEN);
            }
          });
        }); 
        div.appendChild(button);

        footer.appendChild(div);
      }

      cells.forEach(cell => {
        const reveal = cell.model.metadata.get(FLAG);
        if (typeof reveal == 'string') {
          // fsck - hidden is only on the first cell
          if (typeof cell.model.metadata.get(FLAG_HIDDEN) == 'boolean' && ishidden.has(reveal)) {
            cell.model.metadata.delete(FLAG_HIDDEN);
          }

          cell.addClass(CLASS);

          const hidden = cell.model.metadata.get(FLAG_HIDDEN);
          if (typeof hidden == 'boolean') {
            // in the footer cell
            ishidden.set(reveal, hidden);
            addHeader(cell);
          } else {
            // in a solution element

            // fsck - hidden must be on the first cell
            if (!ishidden.has(reveal)) {
              cell.model.metadata.set(FLAG_HIDDEN, false);
              addHeader(cell);
              return;
            }

            if (ishidden.get(reveal)) {
              cell.addClass(CLASS_HIDDEN);
            } else {
              cell.removeClass(CLASS_HIDDEN);
            }
          }
        } else {
          cell.removeClass(CLASS);
          cell.removeClass(CLASS_HIDDEN);
          const classHeader = cell.node.querySelector(`.jp-Cell-footer > .${CLASS_BUTTON}`);
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
        const solution2 = c.model.metadata.get('solution2');
	if (c.model.metadata.get('solution2_first')) {
          c.model.metadata.delete('solution2_first');
          id = generateId();
          c.model.metadata.set(FLAG, id);	// guard
          c.model.metadata.set(FLAG_HIDDEN, solution2 == 'hidden');
        }
	if (solution2) {
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
        if (selectedCells.length < 2) return error('must select more than a single cell');

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
              w.model.metadata.set(FLAG_HIDDEN, true);
            } else {
              w.model.metadata.delete(FLAG_HIDDEN);
            }
          }
        });

        // all cells incase someone splits some by accident
        sync(cells);
      }
    });

    app.contextMenu.addItem({
      command: `${PLUGIN}:toggle`,
      selector: '.jp-Cell',
      rank: 30
    });

    tracker.widgetAdded.connect((tracker, viewer) => {
      if (!viewer) return;
      viewer.revealed.then(() => {
        const { model } = viewer;
        if (!model) return error('huh? no notebook panel model!');

        model.contentChanged.connect(model => {
          viewer.content.fullyRendered.connect(() => {
            const cells = viewer.content.widgets;
            sync(cells);
          });
        });

        const cells = viewer.content.widgets;
        convert(cells);
        sync(cells);
      });
    });
  }
};

export default plugin;
