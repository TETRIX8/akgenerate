// Simple client-side unique visitor tracking
class IPTracker {
  private static instance: IPTracker;
  private storage: Storage;
  private readonly STORAGE_KEY = 'visitor_id';

  private constructor() {
    this.storage = window.localStorage;
  }

  public static getInstance(): IPTracker {
    if (!IPTracker.instance) {
      IPTracker.instance = new IPTracker();
    }
    return IPTracker.instance;
  }

  private generateVisitorId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  public async getOrCreateVisitorId(): Promise<string> {
    let visitorId = this.storage.getItem(this.STORAGE_KEY);
    
    if (!visitorId) {
      visitorId = this.generateVisitorId();
      this.storage.setItem(this.STORAGE_KEY, visitorId);
    }
    
    return visitorId;
  }
}

export default IPTracker;