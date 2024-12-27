# hiit timer

A simple HIIT timer that can announce workouts on every platform

# Development

```bash
npm run dev
```

TODO, see if there is a better way to do npm run dev in dagger

# Deployment

```bash
# build and serve the production container image on port 8003
# be sure to open the firewall to this port for device testing
dagger call build as-service up --ports 8003:80

# publish the image to a registry; ttl.sh is an ephemeral registry
dagger call build publish --address=ttl.sh/hiit_timer

# run the container
docker run -d -p 8003:80 ttl.sh/hiit_timer
```
