# ValheimVarden

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.3.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Deploying with Docker Compose

Build and start the production site:

```bash
docker compose up -d --build
```

By default, the site listens on port `8080` of the VM. If that host port is
already in use, choose another one:

```bash
WEB_PORT=8085 docker compose up -d --build
```

Allow the chosen TCP port in the Oracle Cloud ingress rules and the VM firewall,
then open `http://<VM-public-IP>:<WEB_PORT>`. When using a reverse proxy, forward
requests to the site on port `8080`.

To stop the site:

```bash
docker compose down
```

Lists are stored in each visitor's browser using `localStorage`; they are not
shared between visitors or devices.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
