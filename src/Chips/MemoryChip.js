class Folder {
  constructor(name) {
    //this.Parent = parent;
    this.Type = "folder";
    this.Name = name;
    this.Files = [];
    this.SubDirs = [];
  }
}

class File {
  constructor(name, fileData) {
    this.Type = "file";
    this.Name = name;
    this.FileData = fileData;
  }
}

class MemoryChip {
  constructor(Kernel) {
    this.Kernel = Kernel
    //this.BaseDirectory.Parent = this.BaseDirectory;

    this.BaseDirectory = new Folder("/");
    this.CurrentDirectory = this.BaseDirectory;

    //this.FilePath = [this.BaseDirectory];
    this.Path = ["/"]
  }

  FindDir(directory, name) {
    for (let i = 0; i < directory.SubDirs.length; i++) {
      if (directory.SubDirs[i].Name == name) 
        return true
    } 

    return false
  }

  ChangeDirectory(pathString) {
    let parsedCommand = this.parsePath(pathString)
    let path = [...this.Path]
    
    if (parsedCommand[0] == "/") path = ["/"]
    for (let i = 0; i < parsedCommand.length; i++) {
      let dir = parsedCommand[i]
      if (dir == "..") {
        if (path.length <= 1) return "CANNOT REGRESS TO DEPTH" 
        path.pop()
      } else {
        path.push(dir)
      }
    }

    return this.Goto(path)
  }

  Goto(path) {
    let tempPath = ["/"]
    let currentDir = this.BaseDirectory

    let i = 0;
    while (path != tempPath && i < path.slice(1).length) {
      if (!this.FindDir(currentDir, path.slice(1)[i]))
        return "FOLDER " + path.slice(1)[i] + " NOT FOUND" 

      tempPath.push(path.slice(1)[i])
      for (let j = 0; j < currentDir.SubDirs.length; j++) {
        if (currentDir.SubDirs[j].Name == path.slice(1)[i]) {
          currentDir = currentDir.SubDirs[j]
        }
      }

      i++
    }

    this.Path = tempPath
    this.CurrentDirectory = currentDir
    return null
  }

  parsePath(pathString) {
    let path = []
    if (pathString[0] == "/") {
      pathString = pathString.slice(1)
      path.push("/")
    }

    path = path.concat(pathString.split("/"))
    return path
  }

  GetFiles() {
    return this.CurrentDirectory.Files.sort((a, b) => {
      if (a.Name > b.Name) return 1
      else return -1
    })
  }

  GetDirs() {
    return this.CurrentDirectory.SubDirs.sort((a, b) => {
      if (a.Name > b.Name) return 1
      else return -1
    })
  }

  GetFilePath() {
    return "/" + this.Path.slice(1).join("/")
  }

  GetFile(dirname) {
    let file = this.CurrentDirectory.Files.find((x) => x.Name === dirname);
    if (file === undefined) return;
    if (file.Type == "file") return file;
  }

  DeleteFile(fileName) {
    let file = this.GetFile(fileName)
    if (file === undefined)
      return "FILE NOT FOUND"

    this.CurrentDirectory.Files = this.CurrentDirectory.Files.filter(function(item) {
      return item != file
    })

    this.Kernel.Save()
    return ""
  }

  GetDirectory(dirname) {
    let folder = this.CurrentDirectory.SubDirs.find((x) => x.Name === dirname);
    if (folder === undefined) return;
    if (folder.Type == "folder") return folder;
  }

  DeleteDirectory(dirName) {
    //TODO FIX:
    let dir = this.GetDirectory(dirName)
    if (dir === undefined)
      return "DIR NOT FOUND"

    this.CurrentDirectory.SubDirs = this.CurrentDirectory.SubDirs.filter(function(item) {
      return item != dir
    })
    this.Kernel.Save()
    return ""
  }

  EnterDirectory(dirName) {
    let dir = this.GetDirectory(dirName);
    if (dir == undefined) return 1;

    this.CurrentDirectory = dir;
    this.FilePath.push(dir);
    return 0;
  }

  RegressDirectory() {
    let parentDir = this.CurrentDirectory.Parent;
    if (parentDir === undefined) return 1;

    this.CurrentDirectory = parentDir;
    if (this.FilePath.length > 1) this.FilePath.pop();
    return 0;
  }

  CreateDirectory(folderName) {
    if (this.GetDirectory(folderName) != undefined) return true;
    this.CurrentDirectory.SubDirs.push(
      new Folder(folderName)
    );
    this.Kernel.Save()
  }

  CreateFile(fileName, fileData) {
    if (this.GetFile(fileName) != undefined) return true;
    this.CurrentDirectory.Files.push(new File(fileName, fileData));
    this.Kernel.Save()
  }
}

module.exports = {
  MemoryChip,
};
