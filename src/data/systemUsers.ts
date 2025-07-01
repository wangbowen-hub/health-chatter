// 系统用户配置
export interface SystemUser {
  id: string;
  username: string;
  password: string;
  email: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  medicalRecordFile: string; // 对应的病历表文件路径
  topicId: string; // Dify API 请求时使用的 topic_id
}

// 预定义的系统用户
export const systemUsers: SystemUser[] = [
  {
    id: 'user-001',
    username: 'zhangsan',
    password: 'zhang123',
    email: 'zhangsan@example.com',
    name: '张三',
    age: 35,
    gender: 'male',
    medicalRecordFile: '/patient-records/1.pdf',
    topicId: 'stomach' // 张三的 topic_id
  },
  {
    id: 'user-002',
    username: 'lisi',
    password: 'li123456',
    email: 'lisi@example.com',
    name: '李四',
    age: 28,
    gender: 'female',
    medicalRecordFile: '/patient-records/2.pdf',
    topicId: 'bone' // 李四的 topic_id
  }
];

// 根据用户名获取系统用户
export const getSystemUserByUsername = (username: string): SystemUser | undefined => {
  return systemUsers.find(user => user.username === username);
}; 