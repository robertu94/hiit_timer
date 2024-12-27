/**
 * A generated module for HiitTimer functions
 *
 * This module has been generated via dagger init and serves as a reference to
 * basic module structure as you get started with Dagger.
 *
 * Two functions have been pre-created. You can modify, delete, or add to them,
 * as needed. They demonstrate usage of arguments and return types using simple
 * echo and grep commands. The functions can be called from the dagger CLI or
 * from one of the SDKs.
 *
 * The first line in this comment block is a short description line and the
 * rest is a long description with more detail on the module's purpose or usage,
 * if appropriate. All modules should have a short description.
 */
import { dag, Container, Directory, object, func, argument } from "@dagger.io/dagger"

@object()
export class HiitTimer {
  /**
   * Returns a container with the production environment
   */
  @func()
  build(
       @argument({ defaultPath: "/", ignore: [".git", "*.env", ".github"] }) src_dir: Directory
  ): Container {
      const artifacts = this.buildEnv(src_dir)
        .withExec(["npm", "run", "build"])
        .directory("./dist");

        return dag
        .container()
        .from("nginx:1.25-alpine")
        .withDirectory("/usr/share/nginx/html", artifacts)
        .withExposedPort(80);
  }

  /**
   * Returns a container with the build environment
   */
  @func()
  buildEnv(
       @argument({ defaultPath: "/", ignore: [".git", "*.env", ".github"] }) src_dir: Directory
  ): Container {
    const nodeCache = dag.cacheVolume("node");
    return dag.container()
        .from("node:23")
        .withDirectory("/workdir", src_dir)
        .withWorkdir("/workdir")
        .withMountedCache("/root/.npm", nodeCache)
        .withExec(["npm", "install"])
  }

}
