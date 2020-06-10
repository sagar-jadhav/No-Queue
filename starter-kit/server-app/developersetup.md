## Login into IBM Cloud 

```
ibmcloud login -a cloud.ibm.com -r us-south -g Default --apikey <API_KEY>
```

## Set ORG & SPACE

```
ibmcloud target -o <ORG>
```
```
ibmcloud target -s <SPACE>
```

## Downloaf KUBECONFIG

```
ibmcloud ks cluster config --cluster <CLUSTER_ID>
```

## Verify you are connected to K8s cluster

```
kubectl get ns
```

## Build Docker Image

```
docker build -t backend:latest .
```

## Tag Docker Image

```
docker tag backend:latest <DOCKER_HUB_USER>/cfcbackend:latest
```

## Docker Login

```
docker login
```

## Docker Push

```
docker push <DOCKER_HUB_USER>/cfcbackend:latest
```

## Edit Deployment and edit image

```
kubectl edit deployment cfcbackend -n cfc

Update image with <DOCKER_HUB_USER>/cfcbackend:latest
```