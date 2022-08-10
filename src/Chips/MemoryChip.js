class Folder {
  constructor(name, parent) {
    this.Parent = parent;
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
    this.BaseDirectory = new Folder("BASE");
    this.BaseDirectory.Parent = this.BaseDirectory;

    this.CurrentDirectory = this.BaseDirectory;
    this.FilePath = [this.BaseDirectory];
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
    return this.FilePath.map((file) => file.Name).join("/");
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
    let dir = this.GetDirectory(dirName)
    if (dir === undefined)
      return "DIR NOT FOUND"

    this.CurrentDirectory.SubDirs = this.CurrentDirectory.Files.filter(function(item) {
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
      new Folder(folderName, this.CurrentDirectory)
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
