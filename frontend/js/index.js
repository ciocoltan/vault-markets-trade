const currentPath = window.location.pathname;
        const newPath = currentPath.substring(0, currentPath.lastIndexOf('/') + 1) + 'login/';
        window.location.href = newPath;