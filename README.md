# tvb-ext-unicore

[![Github Actions Status](https://github.com/the-virtual-brain/tvb-ext-unicore/workflows/Build/badge.svg)](https://github.com/the-virtual-brain/tvb-ext-unicore/actions/workflows/build.yml) [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=the-virtual-brain_tvb-ext-unicore&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=the-virtual-brain_tvb-ext-unicore) [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=the-virtual-brain_tvb-ext-unicore&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=the-virtual-brain_tvb-ext-unicore)
 [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=the-virtual-brain_tvb-ext-unicore&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=the-virtual-brain_tvb-ext-unicore)


### TVB Widgets - A Unicore Lab extension

This jupyter extension offers a UI component to monitor HPC jobs through Unicore interface. It allows users 
to easily switch between computing sites, retrieve details about the jobs, 
and also cancel them.

The package is composed of a Python module named `tvbextunicore`
for the server extension and a NPM package named `tvb-ext-unicore`
for the frontend extension.

As the extension provides access to different EBRAINS HPC sites, it needs 
your EBRAINS authentication token in order to work.

There are 2 options to use this extension:

1. Directly in [EBRAINS Lab](https://lab.ebrains.eu/): in this case, your token 
will be retrieved automatically (as you had to login for accessing the extension).
2. Outside EBRAINS Lab: you will need to manually copy your authentication token from 
EBRAINS Lab and keep it in an environment variable called **CLB_AUTH**.

## Requirements

* JupyterLab >= 3.0
* pyunicore >= 0.9.15

## Install

To install the extension, execute:

```bash
pip install tvb-ext-unicore
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall tvb-ext-unicore
```


## Troubleshoot

If you are seeing the frontend extension, but it is not working, check
that the server extension is enabled:

```bash
jupyter server extension list
```

If the server extension is installed and enabled, but you are not seeing
the frontend extension, check the frontend extension is installed:

```bash
jupyter labextension list
```


## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Install external dependencies
pip install pyunicore

# Clone the tvb-ext-unicore repo to your local environment
# Change directory to the tvb-ext-unicore directory
cd tvb-ext-unicore
# Install package in development mode
pip install -e .
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Server extension must be manually installed in develop mode
jupyter server extension enable tvb-ext-unicore

# Define CLB_AUTH environment variable holding your EBRAINS token
export CLB_AUTH=${ebrains_token}

# Rebuild extension Typescript source after making changes
jlpm run build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm run watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm run build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Development uninstall

```bash
# Server extension must be manually disabled in develop mode
jupyter server extension disable tvbextunicore
pip uninstall tvb-ext-unicore
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `tvb-ext-unicore` within that folder.

### Packaging the extension

See [RELEASE](RELEASE.md)

### Acknowledgments

This project has received funding from the European Union’s Horizon 2020 Framework Programme for Research and Innovation under the Specific Grant Agreement No. 945539 (Human Brain Project SGA3).
