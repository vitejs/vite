// This demonstrates TypeScript and modern JavaScript features
// that can be transformed via oxc

interface User {
  name: string;
  age: number;
  preferences?: {
    theme: 'light' | 'dark';
    language: string;
  };
}

class UserManager {
  private users: User[] = [];

  addUser(user: User): void {
    this.users.push(user);
    this.displayUsers();
  }

  displayUsers(): void {
    const container = document.getElementById('content');
    if (!container) return;

    container.innerHTML = '<h2>Users:</h2>';
    
    this.users.forEach((user, index) => {
      const userDiv = document.createElement('div');
      userDiv.innerHTML = `
        <div style="border: 1px solid #ccc; margin: 8px; padding: 8px;">
          <strong>${user.name}</strong> (${user.age} years old)
          ${user.preferences ? `
            <br>Theme: ${user.preferences.theme}
            <br>Language: ${user.preferences.language}
          ` : ''}
        </div>
      `;
      container.appendChild(userDiv);
    });
  }
}

// Modern JavaScript features
const userManager = new UserManager();

// Arrow functions with async/await
const loadDemoData = async (): Promise<void> => {
  const users: User[] = [
    {
      name: 'Alice',
      age: 25,
      preferences: {
        theme: 'dark',
        language: 'en'
      }
    },
    {
      name: 'Bob',
      age: 30,
      preferences: {
        theme: 'light',
        language: 'es'
      }
    },
    {
      name: 'Charlie',
      age: 28
    }
  ];

  for (const user of users) {
    userManager.addUser(user);
  }
};

// Optional chaining and nullish coalescing
const config = {
  title: document.title ?? 'Default Title',
  features: {
    oxc: true,
    transformations: ['typescript', 'jsx', 'syntax-lowering']
  }
};

console.log('App config:', config);
console.log('Oxc enabled:', config.features?.oxc ?? false);

// Initialize the demo
loadDemoData().catch(console.error);

// Export for testing
export { UserManager, type User };