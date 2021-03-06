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
  constructor() {
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

  GetDirectory(dirname) {
    let folder = this.CurrentDirectory.SubDirs.find((x) => x.Name === dirname);
    if (folder === undefined) return;
    if (folder.Type == "folder") return folder;
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
  }

  CreateFile(fileName, fileData) {
    if (this.GetFile(fileName) != undefined) return true;
    this.CurrentDirectory.Files.push(new File(fileName, fileData));
  }
}

module.exports = {
  MemoryChip,
};
