import { createRouter, createWebHistory } from 'vue-router';
import EditorView from '../views/EditorView.vue';
import ProjectsView from '../views/ProjectsView.vue';
import ShareView from '../views/ShareView.vue';
import LoginView from '../views/LoginView.vue';

const routes = [
  {
    path: '/',
    redirect: '/editor'
  },
  {
    path: '/editor',
    name: 'editor-new',
    component: EditorView
  },
  {
    path: '/editor/:id',
    name: 'editor-edit',
    component: EditorView
  },
  {
    path: '/projects',
    name: 'projects',
    component: ProjectsView
  },
  {
    path: '/share/:token',
    name: 'share',
    component: ShareView
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView
  }
];

export const router = createRouter({
  history: createWebHistory(),
  routes
});
