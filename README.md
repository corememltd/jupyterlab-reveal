Reveal solutions in JupyterLab

Select a number of cells, right click and select 'Toggle Solution'.

If any of the cells are part of an existing solution, then all will be marked as non-solution cells. If all are non-solution cells, they will form a group of solution cells where the first cell is used as the leading solution text whilst the remaining cells are then hidden behind a button.

Inspired by the following plugins, which this plugin also converts to its own native 'reveal' format:

 * [Exercise2](https://jupyter-contrib-nbextensions.readthedocs.io/en/latest/nbextensions/exercise2/readme.html)
 * [@rmotr/jupyterlab-solutions](https://www.npmjs.com/package/@rmotr/jupyterlab-solutions)

## Requirements

- JupyterLab >= 3.0

## Install

To install the extension, execute:

```bash
#pip install jupyterlab_reveal
pip install git+https://github.com/corememltd/jupyterlab-reveal.git
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall jupyterlab_reveal
```

## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the jupyterlab_reveal directory
# Install package in development mode
virtualenv venv
. venv/bin/activate
# if you have /tmp mounted noexec then you will need to include (you will see an error about not being able to load an .so)
# export TMPDIR="$PWD/venv/tmp"
pip install jupyterlab
pip install -e .
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Rebuild extension Typescript source after making changes
jlpm build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Development uninstall

```bash
pip uninstall jupyterlab_reveal
deactivate
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `jupyterlab-reveal` within that folder.

### Packaging the extension

See [RELEASE](RELEASE.md)
