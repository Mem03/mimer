import * as k8s from '@kubernetes/client-node';

// Load the local Kubernetes config (~/.kube/config)
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

export async function getComputeClusters(namespace: string) {
  try {
    const response = await k8sApi.listNamespacedPod({
      namespace: namespace,
      labelSelector: 'component=singleuser-server'
    });

    if (!response.items) return [];

    // Map the raw Kubernetes data into a clean, readable format
    return response.items.map((pod) => {
      // Calculate total restarts across all containers in the pod
      const restarts = pod.status?.containerStatuses?.reduce(
        (acc, curr) => acc + curr.restartCount, 0
      ) || 0;

      return {
        name: pod.metadata?.name || 'Unknown Cluster',
        status: pod.status?.phase || 'Unknown', // e.g., Running, Pending, Failed
        restarts: restarts,
        node: pod.spec?.nodeName || 'Unknown Node',
        startedAt: pod.status?.startTime ? new Date(pod.status.startTime).toLocaleString() : '-',
      };
    });
  } catch (error) {
    console.error("Error fetching Kubernetes compute pods:", error);
    return [];
  }
}

export async function getComputeDetails(podName: string, namespace: string) {
  try {
    const response = await k8sApi.readNamespacedPod({
      name: podName,
      namespace: namespace
    });

    const pod = response;
    
    // Extract the main container (usually the Jupyter/Spark container)
    const container = pod.spec?.containers?.[0];

    return {
      name: pod.metadata?.name || podName,
      status: pod.status?.phase || 'Unknown',
      ip: pod.status?.podIP || 'Allocating...',
      node: pod.spec?.nodeName || 'Pending scheduling',
      image: container?.image || 'Unknown Image',
      // Kubernetes stores resources like "2G" or "1000m". We fetch them safely.
      cpuLimit: container?.resources?.limits?.cpu || 'No Limit',
      memoryLimit: container?.resources?.limits?.memory || 'No Limit',
      startedAt: pod.status?.startTime ? new Date(pod.status.startTime).toLocaleString() : 'Not started',
    };
  } catch (error) {
    console.error(`Error fetching details for pod ${podName}:`, error);
    return null;
  }
}