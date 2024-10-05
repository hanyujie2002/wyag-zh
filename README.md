# 从零开始写 Git

**备注**：本文翻译自 [https://wyag.thb.lt/](https://wyag.thb.lt/)，原文 Github 仓库为 [https://github.com/thblt/write-yourself-a-git](https://github.com/thblt/write-yourself-a-git)，中文翻译仓库为 [https://github.com/hanyujie2002/wyag-zh](https://github.com/hanyujie2002/wyag-zh)

## 1. 引言

（2023 年 8 月）Wyag 现已完成！

本文旨在从基础开始，深入解释 [Git 版本控制系统](https://git-scm.com/)。这听起来并不简单，过去的尝试往往效果不佳。但有一个简单的方法：要理解 Git 的内部机制，只需从头实现一个 Git。

这不是开玩笑，也并不复杂：如果你仔细阅读这篇文章并编写代码（或者直接 [下载代码](./wyag.zip) 压缩包——但我强烈建议你自己动手写代码），你将得到一个名为 `wyag` 的程序，它实现了 Git 的基本功能：`init`、`add`、`rm`、`status`、`commit`、`log`……而且与 Git 本身兼容，甚至可以说最后添加关于提交部分的记录是由 wyag 本身而不是 Git 创建的 [（链接）](https://github.com/thblt/write-yourself-a-git/commit/ed26daffb400b2be5f30e044c3237d220226d867)。所有这一切仅需 988 行简单的 Python 代码。

那么，Git 真的有那么复杂吗？我认为复杂性是个误解。确实，Git 是一个功能丰富的大型程序，但其核心其实非常简单，表面上的复杂性往往源于其深奥之处（而且 [Git 被比作墨西哥卷饼](https://byorgey.wordpress.com/2009/01/12/abstraction-intuition-and-the-monad-tutorial-fallacy/) 的讨论可能也没有帮助）。实际上，让 Git 令人困惑的，正是它核心模型的极简与强大。核心的简单性与丰富的应用之间的结合，常常让人难以理解，因为需要一定的思维跳跃才能从基本的简单性中推导出各种应用。

通过实现 Git，我们将能更清晰地认识其基本原理。

**期待什么？** 本文将详细实现和解释一个简化版本的 Git 核心命令（如果有不清楚的地方，请随时 [反馈](#反馈）！)。我会保持代码简单明了，因此 `wyag` 的功能远不能与真正的 Git 命令行相提并论，但缺失的部分将显而易见，任何想要尝试的人都能轻松添加这些功能。“将 wyag 升级为一个功能齐全的 Git 库和 CLI 是留给读者的练习”，正如人们所说的那样。

更具体地说，我们将实现：

- `add` （[wyag 源代码](#cmd-add)） [git 手册页面](https://git-scm.com/docs/git-add)
- `cat-file` （[wyag 源代码](#cmd-cat-file)） [git 手册页面](https://git-scm.com/docs/git-cat-file)
- `check-ignore` （[wyag 源代码](#cmd-check-ignore)） [git 手册页面](https://git-scm.com/docs/git-check-ignore)
- `checkout` （[wyag 源代码](#cmd-checkout)） [git 手册页面](https://git-scm.com/docs/git-checkout)
- `commit` （[wyag 源代码](#cmd-commit)） [git 手册页面](https://git-scm.com/docs/git-commit)
- `hash-object` （[wyag 源代码](#cmd-hash-object)） [git 手册页面](https://git-scm.com/docs/git-hash-object)
- `init` （[wyag 源代码](#cmd-init)） [git 手册页面](https://git-scm.com/docs/git-init)
- `log` （[wyag 源代码](#cmd-log)） [git 手册页面](https://git-scm.com/docs/git-log)
- `ls-files` （[wyag 源代码](#cmd-ls-files)） [git 手册页面](https://git-scm.com/docs/git-ls-files)
- `ls-tree` （[wyag 源代码](#cmd-ls-tree)） [git 手册页面](https://git-scm.com/docs/git-ls-tree)
- `rev-parse` （[wyag 源代码](#cmd-rev-parse)） [git 手册页面](https://git-scm.com/docs/git-rev-parse)
- `rm` （[wyag 源代码](#cmd-rm)） [git 手册页面](https://git-scm.com/docs/git-rm)
- `show-ref` （[wyag 源代码](#cmd-show-ref)） [git 手册页面](https://git-scm.com/docs/git-show-ref)
- `status` （[wyag 源代码](#cmd-status)） [git 手册页面](https://git-scm.com/docs/git-status)
- `tag` （[wyag 源代码](#cmd-tag)） [git 手册页面](https://git-scm.com/docs/git-tag)

你无需掌握太多知识即可跟上这篇文章：只需了解一些基本的 Git（显然）、一些基本的 Python 和一些基本的 shell 知识。

- 首先，我假设你对最基本的 **git 命令** 有一定了解——不需要达到专家水平，但如果你从未使用过 `init`、`add`、`rm`、`commit` 或 `checkout`，你可能会感到困惑。
- 在编程语言方面，wyag 将使用 **Python** 实现。代码将保持简单易懂，因此对于初学者来说，Python 看起来像伪代码，容易上手（讽刺的是，最复杂的部分将是命令行参数解析逻辑，但你不需要深入理解这个）。如果你会编程但从未接触过 Python，建议找个速成课程熟悉一下这门语言。
- `wyag` 和 `git` 都是终端程序。我假设你对 Unix 终端操作非常熟悉。再强调一遍，你不需要是个黑客，但 `cd`、`ls`、`rm`、`tree` 等命令应该是你工具箱里的基本工具。

**对 Windows 用户的说明**

`wyag` 应该能够在任何带有 Python 解释器的类 Unix 系统上运行，但我不确定它在 Windows 上的表现。测试套件绝对需要一个兼容 bash 的 shell，我相信 WSL 可以满足这一需求。此外，如果你使用 WSL，请确保你的 `wyag` 文件采用 Unix 风格的行结束符（[请参见这个 StackOverflow 解决方案，适用于 VS Code](https://stackoverflow.com/questions/48692741/how-can-i-make-all-line-endings-eols-in-all-files-in-visual-studio-code-unix)）。欢迎 Windows 用户提供反馈！

**致谢**

本文得益于多位贡献者的重要帮助，我对此深表感谢。特别感谢：

- GitHub 用户 [tammoippen](https://github.com/tammoippen)，他草拟了我一度遗忘的 `tag_create` 函数（这是 [\#9](https://github.com/thblt/write-yourself-a-git/issues/9)）。
- GitHub 用户 [hjlarry](https://github.com/hjlarry) 在 [\#22](https://github.com/thblt/write-yourself-a-git/pull/22) 中修复了多个问题。
- GitHub 用户 [cutebbb](https://github.com/cutebbb) 在 [\#27](https://github.com/thblt/write-yourself-a-git/pull/27/) 中实现了 `ls-files` 的第一个版本，从而让 wyag 实现了暂存区！

## 2. 开始

你需要 Python 3.10 或更高版本，以及你喜欢的文本编辑器。我们不需要第三方包或虚拟环境，任何标准的 Python 解释器都可以满足需求。

我们将代码分为两个文件：

- 一个可执行文件，名为 `wyag`；
- 一个 Python 库，名为 `libwyag.py`；

每个软件项目开始时都会有很多样板代码，让我们尽快完成这部分。

首先创建一个（非常简短的）可执行文件。在文本编辑器中创建一个新文件，命名为 `wyag`，并复制以下几行：

```python
#!/usr/bin/env python3

import libwyag
libwyag.main()
```

然后使其可执行：

``` shell
$ chmod +x wyag
```

完成了！

接下来是库文件。它必须命名为 `libwyag.py`，并与 `wyag` 可执行文件位于同一目录中。首先在文本编辑器中打开空的 `libwyag.py` 文件。

我们首先需要导入一些模块（可以逐一复制每个导入，或合并成一行）：

- Git 是一个命令行应用程序，因此我们需要解析命令行参数的工具。Python 提供了一个很棒的模块名为 [argparse](https://docs.python.org/3/library/argparse.html)，可以为我们完成 99% 的工作。

    ```python
    import argparse
    ```

- 我们还需要一些基本库中没有的容器类型，特别是 `OrderedDict`，它在 [collections](https://docs.python.org/3/library/collections.html#collections.OrderedDict) 中。

    ```python
    import collections
    ```

- Git 使用的配置文件格式基本上是微软的 INI 格式。可以使用 [configparser](https://docs.python.org/3/library/configparser.html) 模块读取和写入这些文件。

    ```python
    import configparser
    ```

- 我们还会进行一些日期/时间的操作：

    ```python
    from datetime import datetime
    ```

- 需要一次性读取 Unix 的用户/组数据库（`grp` 用于组，`pwd` 用于用户）。这是因为 Git 保存文件的所有者/组 ID，我们希望将其以文本形式美观地显示出来：

    ```python
    import grp, pwd
    ```

- 为了支持 `.gitignore`，我们需要匹配如 \*.txt 的文件名模式。文件名匹配功能在 `fnmatch` 中：

    ```python
    from fnmatch import fnmatch
    ```

- Git 广泛使用 SHA-1 函数。在 Python 中，它位于 [hashlib](https://docs.python.org/3/library/hashlib.html) 中。

    ```python
    import hashlib
    ```

- 只需要使用 [math](https://docs.python.org/3/library/math.html) 中的一个函数：

    ```python
    from math import ceil
    ```

- [os](https://docs.python.org/3/library/os.html) 和 [os.path](https://docs.python.org/3/library/os.path.html) 提供了一些很好的文件系统抽象例程。

    ```python
    import os
    ```

- 我们还需要使用一些正则表达式：

    ```python
    import re
    ```

- 另外需要 [sys](https://docs.python.org/3/library/sys.html) 来访问实际的命令行参数（在 `sys.argv` 中）：

    ```python
    import sys
    ```

- Git 使用 zlib 进行所有内容的压缩。Python 中也有 [这个功能](https://docs.python.org/3/library/zlib.html)：

    ```python
    import zlib
    ```

导入完成。我们将频繁处理命令行参数。Python 提供了一个简单但功能强大的解析库 `argparse`。这是一个不错的库，但其接口可能并不是最直观的；如果需要，可以参考其 [文档](https://docs.python.org/3/library/argparse.html)。

```python
argparser = argparse.ArgumentParser(description="最简单的内容跟踪器")
```

我们需要处理子命令（如 git 中的 `init`、`commit` 等）。在 argparse 的术语中，这些被称为“子解析器”。此时我们只需声明我们的 CLI 将使用子解析器，并且所有调用都必须包含一个——你不能只调用 `git`，而是要调用 `git COMMAND`。

```python
argsubparsers = argparser.add_subparsers(title="Commands", dest="command")
argsubparsers.required = True
```

`dest="command"` 参数表示所选择的子解析器的名称将作为字符串返回，存储在名为 `command` 的字段中。因此，我们只需读取这个字符串并相应地调用正确的函数。按照惯例，我将这些函数称为“桥接函数（bridges functions）”，并以 `cmd_` 为前缀。桥接函数将解析的参数作为唯一参数，并负责处理和验证它们，然后执行实际命令。

```python
def main(argv=sys.argv[1:]):
    args = argparser.parse_args(argv)
    match args.command:
        case "add"          : cmd_add(args)
        case "cat-file"     : cmd_cat_file(args)
        case "check-ignore" : cmd_check_ignore(args)
        case "checkout"     : cmd_checkout(args)
        case "commit"       : cmd_commit(args)
        case "hash-object"  : cmd_hash_object(args)
        case "init"         : cmd_init(args)
        case "log"          : cmd_log(args)
        case "ls-files"     : cmd_ls_files(args)
        case "ls-tree"      : cmd_ls_tree(args)
        case "rev-parse"    : cmd_rev_parse(args)
        case "rm"           : cmd_rm(args)
        case "show-ref"     : cmd_show_ref(args)
        case "status"       : cmd_status(args)
        case "tag"          : cmd_tag(args)
        case _              : print("无效命令。")
```

## 3. 创建仓库：init

显然，按照时间顺序和逻辑顺序，第一个 Git 命令是 `git init`，所以我们将首先创建 `wyag init`。为此，我们需要一些非常基础的仓库抽象。

### 3.1. 仓库对象

显然，我们需要对仓库的抽象：几乎每次运行 Git 命令时，我们都是在尝试对某个仓库进行操作，创建、读取或修改。

Git 仓库由两部分组成：一个是“工作区（work tree）”，其中存放要进行版本控制的文件，另一个是“Git 目录（git directory）”，Git 在这里存储自己的数据。在大多数情况下，工作区是一个常规目录，而 Git 目录是工作区的一个子目录，名为 `.git`。

Git 支持*更多*的情况（裸仓库、分离的 Git 目录 等），但我们不需要这些：我们将坚持使用基本的 `worktree/.git` 方法。我们的仓库对象将仅包含两个路径：工作区和 Git 目录。

要创建一个新的 `Repository` 对象，我们只需进行一些检查：

- 我们必须验证该目录是否存在，并且包含一个名为 `.git` 的子目录。
- 我们读取 `.git/config` 中的配置（这只是一个 INI 文件），并确保 `core.repositoryformatversion` 为 0。稍后我们会详细讨论这个字段。

构造函数接受一个可选的 `force` 参数，用于禁用所有检查。这是因为稍后我们将创建的 `repo_create()` 函数使用 `Repository` 对象来*创建*仓库。因此，我们需要一种方法，即使在（仍然）无效的文件系统位置，也能创建仓库。

```python
class GitRepository (object):
    """一个 Git 仓库"""

    worktree = None
    gitdir = None
    conf = None

    def __init__(self, path, force=False):
        self.worktree = path
        self.gitdir = os.path.join(path, ".git")

        if not (force or os.path.isdir(self.gitdir)):
            raise Exception("Not a Git repository %s" % path)

        # 读取 .git/config 中的配置文件
        self.conf = configparser.ConfigParser()
        cf = repo_file(self, "config")

        if cf and os.path.exists(cf):
            self.conf.read([cf])
        elif not force:
            raise Exception("Configuration file missing")

        if not force:
            vers = int(self.conf.get("core", "repositoryformatversion"))
            if vers != 0:
                raise Exception("Unsupported repositoryformatversion %s" % vers)
```

我们将会在仓库中处理**大量**的路径。不妨创建一些工具函数来计算这些路径，并在需要时创建缺失的目录结构。首先，我们先写一个通用的路径构建函数：

```python
def repo_path(repo, *path):
    """Compute path under repo's gitdir."""
    return os.path.join(repo.gitdir, *path)
```

（关于 Python 语法的一点说明：`*path` 前的星号使得函数具有可变参数特性，因此可以将多个路径组件作为单独的参数调用。例如，`repo_path(repo, "objects", "df", "4ec9fc2ad990cb9da906a95a6eda6627d7b7b0")` 是一个有效的调用。函数接收到的 `path` 是一个列表。）

接下来的两个函数，`repo_file()` 和 `repo_dir()`，分别返回并可选地创建指向文件或目录的路径。它们之间的区别在于，文件版本只会创建到最后一个组件的目录。

```python
def repo_file(repo, *path, mkdir=False):
    """Same as repo_path, but create dirname(*path) if absent.  For
example, repo_file(r, \"refs\", \"remotes\", \"origin\", \"HEAD\") will create
.git/refs/remotes/origin."""

    if repo_dir(repo, *path[:-1], mkdir=mkdir):
        return repo_path(repo, *path)

def repo_dir(repo, *path, mkdir=False):
    """Same as repo_path, but mkdir *path if absent if mkdir."""

    path = repo_path(repo, *path)

    if os.path.exists(path):
        if (os.path.isdir(path)):
            return path
        else:
            raise Exception("Not a directory %s" % path)

    if mkdir:
        os.makedirs(path)
        return path
    else:
        return None
```

（关于语法的第二个也是最后一个说明：由于 `*path` 中的星号使得函数具有可变参数特性，因此 `mkdir` 参数必须通过名称显式传递。例如，`repo_file(repo, "objects", mkdir=True)`。）

要 **创建** 一个新的仓库，我们从一个目录开始（如果该目录尚不存在则创建），然后在其中创建 **git 目录**（该目录必须尚不存在，或者为空）。这个目录名为 `.git`（前面的点使其在 Unix 系统上被视为“隐藏”），并包含：

- `.git/objects/` : 对象存储，我们将在 [下一节](#objects) 中介绍。
- `.git/refs/` : 引用存储，我们稍后会讨论 [更多内容](#cmd-show-ref)。它包含两个子目录，`heads` 和 `tags`。
- `.git/HEAD` : 当前 HEAD 的引用（稍后会详细介绍！）
- `.git/config` : 仓库的配置文件。
- `.git/description` : 包含该仓库内容的自由格式描述，供人类阅读，且很少使用。

<!-- end list -->

```python
def repo_create(path):
    """Create a new repository at path."""

    repo = GitRepository(path, True)

    # First, we make sure the path either doesn't exist or is an
    # empty dir.

    if os.path.exists(repo.worktree):
        if not os.path.isdir(repo.worktree):
            raise Exception ("%s is not a directory!" % path)
        if os.path.exists(repo.gitdir) and os.listdir(repo.gitdir):
            raise Exception("%s is not empty!" % path)
    else:
        os.makedirs(repo.worktree)

    assert repo_dir(repo, "branches", mkdir=True)
    assert repo_dir(repo, "objects", mkdir=True)
    assert repo_dir(repo, "refs", "tags", mkdir=True)
    assert repo_dir(repo, "refs", "heads", mkdir=True)

    # .git/description
    with open(repo_file(repo, "description"), "w") as f:
        f.write("Unnamed repository; edit this file 'description' to name the repository.\n")

    # .git/HEAD
    with open(repo_file(repo, "HEAD"), "w") as f:
        f.write("ref: refs/heads/master\n")

    with open(repo_file(repo, "config"), "w") as f:
        config = repo_default_config()
        config.write(f)

    return repo
```

配置文件非常简单，它是一个类似于 [INI](https://en.wikipedia.org/wiki/INI_file) 的文件，包含一个部分（`[core]`）和三个字段：

- `repositoryformatversion = 0`：gitdir 格式的版本。0 表示初始格式，1 表示相同格式但带有扩展。如果大于 1，git 将会崩溃；wyag 只接受 0。
- `filemode = false`：禁用对工作区中文件模式（权限）更改的跟踪。
- `bare = false`：表示该仓库有一个工作区。Git 支持一个可选的 `worktree` 键，用于指示工作区的位置，如果不是 `..`；而 wyag 不支持这个。

我们使用 Python 的 `configparser` 库来创建这个文件：

```python
def repo_default_config():
    ret = configparser.ConfigParser()

    ret.add_section("core")
    ret.set("core", "repositoryformatversion", "0")
    ret.set("core", "filemode", "false")
    ret.set("core", "bare", "false")

    return ret
```

### 3.2. init 命令

现在我们有了读取和创建仓库的代码，让我们通过创建 `wyag init` 命令来使这些代码可以从命令行使用。`wyag init` 的行为与 `git init` 一样——当然，定制化程度要低得多。`wyag init` 的语法如下：

```example
wyag init [path]
```

我们已经有了完整的仓库创建逻辑。要创建这个命令，我们只需要再添加两件事：

1. 我们需要创建一个 argparse 子解析器来处理我们命令的参数。

    ```python
    argsp = argsubparsers.add_parser("init", help="初始化一个新的空仓库。")
    ```

    在 `init` 的情况下，有一个单独的可选位置参数：初始化仓库的路径。默认值为当前目录 `.`：

    ```python
    argsp.add_argument("path",
                       metavar="directory",
                       nargs="?",
                       default=".",
                       help="仓库创建的路径。")
    ```

2. 我们还需要一个“桥接”函数，该函数将从 argparse 返回的对象中读取参数值，并使用正确的值调用实际函数。

    ```python
    def cmd_init(args):
        repo_create(args.path)
    ```

就这样完成了！如果你按照这些步骤操作，现在应该能够在任何地方执行 `wyag init` 来创建一个 Git 仓库：

```example
$ wyag init test
```

（`wyag` 可执行文件通常不在你的 `$PATH` 中：你需要使用完整名称调用它，例如 `~/projects/wyag/wyag init .`）

### 3.3. repo_find() 函数

在我们实现仓库的过程中，我们需要一个函数来找到当前仓库的根目录。我们会频繁使用这个函数，因为几乎所有的 Git 功能都在现有的仓库上工作（当然，`init` 除外！）。有时这个根目录是当前目录，但也可能是父目录：你的仓库根目录可能在 `~/Documents/MyProject`，而你当前可能在 `~/Documents/MyProject/src/tui/frames/mainview/` 工作。我们现在要创建的 `repo_find()` 函数将从当前目录开始查找根目录，并递归向上直到 `/`。为了识别一个路径是否为仓库，它将检查 `.git` 目录是否存在。

```python
def repo_find(path=".", required=True):
    path = os.path.realpath(path)

    if os.path.isdir(os.path.join(path, ".git")):
        return GitRepository(path)

    # 如果没有返回，递归查找父目录
    parent = os.path.realpath(os.path.join(path, ".."))

    if parent == path:
        # 底部情况
        # os.path.join("/", "..") == "/":
        # 如果 parent==path，那么 path 就是根目录。
        if required:
            raise Exception("没有 git 目录。")
        else:
            return None

    # 递归情况
    return repo_find(parent, required)
```

仓库的部分就完成了！

## 4. 读取和写入对象：hash-object 和 cat-file

### 4.1. 什么是对象？

现在我们已经有了仓库，接下来可以往里面放东西了。此外，仓库本身是比较无聊的，编写一个 Git 实现不应该只是简单地写一堆 `mkdir`。让我们来谈谈 **对象**，并实现 `git hash-object` 和 `git cat-file`。

也许你对这两个命令并不熟悉——它们并不是日常 Git 工具箱的一部分，实际上它们是相当底层的（在 Git 行话中称为“管道”）。它们的功能其实非常简单：`hash-object` 将一个现有文件转换为 Git 对象，而 `cat-file` 则将一个现有的 Git 对象打印到标准输出。

那么，**Git 对象到底是什么？** 从本质上讲，Git 是一个“基于内容寻址的文件系统”。这意味着，与普通文件系统不同，普通文件系统中，文件的名称是任意的，与文件内容无关，而 Git 存储的文件名称是根据其内容数学推导而来的。这有一个非常重要的含义：如果某个文本文件的单个字节发生变化，它的内部名称也会随之改变。简单来说：你在 Git 中并不是 *修改* 文件，而是在不同的位置创建一个新文件。对象就是这样：**在 Git 仓库中的文件，其路径由其内容决定**。

**Git 其实并不是一个真正的键值存储**

一些文档，包括优秀的 [Pro Git](https://git-scm.com/book/id/v2/Git-Internals-Git-Objects)，将 Git 称为“键值存储”。这并不错误，但可能会误导人。普通的文件系统实际上更接近于键值存储，而不是 Git。由于 Git 是从数据计算键的，因此可以更准确地称其为 *值值存储*。

Git 使用对象来存储很多东西：首先也是最重要的，就是它在版本控制中保存的实际文件——例如源代码。提交（commit）也是对象，标签（tag）也是。除了少数显著的例外（稍后会看到！），几乎所有东西在 Git 中都以对象的形式存储。

Git 存储给定对象的路径是通过计算其内容的 [SHA-1](https://en.wikipedia.org/wiki/SHA-1) [哈希值](https://en.wikipedia.org/wiki/Cryptographic_hash_function) 来确定的。更确切地说，Git 将哈希值表示为小写的十六进制字符串，并将其分为两部分：前两位字符和其余部分。它使用前两位作为目录名，其余部分作为文件名（这是因为大多数文件系统不喜欢在单个目录中有太多文件，这会导致性能下降。Git 的方法创建了 256 个可能的中间目录，从而将每个目录的平均文件数减少到 256 分之一）。

**什么是哈希函数？**

SHA-1 被称为“哈希函数”。简单来说，哈希函数是一种单向数学函数：计算一个值的哈希值很简单，但无法反向计算出哪个值生成了该哈希。

哈希函数的一个非常简单的例子是经典的 `len`（或 `strlen`）函数，它返回字符串的长度。计算字符串的长度非常容易，而且给定字符串的长度永远不会改变（当然，除非字符串本身发生变化！），但仅凭长度是不可能恢复原始字符串的。*密码学*哈希函数是同类函数的复杂版本，增加了一个特性：计算出一个输入值以生成给定的哈希是相当困难的，几乎不可能。（要生成一个长度为 12 的输入 `i`，你只需输入 12 个随机字符。使用如 SHA-1 这样的算法，则需要更长的时间——长到几乎不可能的程度[^1]）。

在我们开始实现对象存储系统之前，必须了解它们的确切存储格式。一个对象以一个头部开始，头部指定其类型：`blob`、`commit`、`tag` 或 `tree`（稍后会详细介绍）。这个头部后面跟着一个 ASCII 空格（0x20），然后是以 ASCII 数字表示的对象大小（以字节为单位），接着是一个空字节（0x00），最后是对象的内容。在 Wyag 的仓库中，一个提交对象的前 48 个字节如下所示：

```example
00000000  63 6f 6d 6d 69 74 20 31  30 38 36 00 74 72 65 65  |commit 1086.tree|
00000010  20 32 39 66 66 31 36 63  39 63 31 34 65 32 36 35  | 29ff16c9c14e265|
00000020  32 62 32 32 66 38 62 37  38 62 62 30 38 61 35 61  |2b22f8b78bb08a5a|
```

在第一行中，我们看到类型头部、一个空格（`0x20`）、以 ASCII 表示的大小（1086）和空分隔符 `0x00`。第一行的最后四个字节是该对象内容的开头，单词“tree”——当我们讨论提交时会进一步探讨这个。

对象（头部和内容）是使用 `zlib` 压缩存储的。

### 4.2. 通用对象

对象可以有多种类型，但它们都共享相同的存储/检索机制和相同的通用头格式。在深入各种对象类型的细节之前，我们需要抽象出这些共同特征。最简单的方法是创建一个通用的 `GitObject`，并实现两个未完成的方法：`serialize()` 和 `deserialize()`，以及一个默认的 `init()`，用于在需要时创建一个新的空对象（抱歉，Python 爱好者，这样的设计不太优雅，但可能比超级构造函数更容易阅读）。我们的 `__init__` 要么从提供的数据加载对象，要么调用子类提供的 `init()` 来创建一个新的空对象。

稍后，我们将对这个通用类进行子类化，为每种对象格式实际实现这些函数。

```python
class GitObject (object):

    def __init__(self, data=None):
        if data is not None:
            self.deserialize(data)
        else:
            self.init()

    def serialize(self, repo):
        """这个函数必须由子类实现。

它必须从 self.data 读取对象的内容，这是一个字节字符串，并进行必要的转换以生成有意义的表示。具体意味着什么取决于每个子类。"""
        raise Exception("未实现！")

    def deserialize(self, data):
        raise Exception("未实现！")

    def init(self):
        pass  # 什么也不做。这是一个合理的默认值！
```

### 4.3. 读取对象

要读取一个对象，我们需要知道它的 SHA-1 哈希值。然后，我们根据这个哈希计算它的路径（使用上面解释的公式：前两个字符，然后是目录分隔符 `/`，然后是剩余部分），并在 gitdir 的“objects”目录中查找它。也就是说，`e673d1b7eaa0aa01b5bc2442d570a765bdaae751` 的路径是 `.git/objects/e6/73d1b7eaa0aa01b5bc2442d570a765bdaae751`。

接下来，我们将该文件作为二进制文件读取，并使用 `zlib` 进行解压缩。

从解压缩的数据中，我们提取两个头部组件：对象类型和大小。根据类型，我们确定实际使用的类。我们将大小转换为 Python 整数，并检查其是否匹配。

完成所有操作后，我们只需调用该对象格式的正确构造函数。

```python
def object_read(repo, sha):
    """从 Git 仓库 repo 读取对象 sha。返回一个
    GitObject，其确切类型取决于对象。"""

    path = repo_file(repo, "objects", sha[0:2], sha[2:])

    if not os.path.isfile(path):
        return None

    with open(path, "rb") as f:
        raw = zlib.decompress(f.read())

        # 读取对象类型
        x = raw.find(b' ')
        fmt = raw[0:x]

        # 读取并验证对象大小
        y = raw.find(b'\x00', x)
        size = int(raw[x:y].decode("ascii"))
        if size != len(raw) - y - 1:
            raise Exception("格式错误的对象 {0}: 长度错误".format(sha))

        # 选择构造函数
        match fmt:
            case b'commit': c = GitCommit
            case b'tree': c = GitTree
            case b'tag': c = GitTag
            case b'blob': c = GitBlob
            case _:
                raise Exception("对象 {1} 的未知类型 {0}".format(fmt.decode("ascii"), sha))

        # 调用构造函数并返回对象
        return c(raw[y + 1:])
```

### 4.4. 写入对象

写入对象实际上是读取它的反向过程：我们计算哈希值，插入头部，使用 zlib 进行压缩，然后将结果写入正确的位置。这实际上不需要太多解释，只需注意哈希是在添加头部**之后**计算的（因此它是对象本身的哈希值，而不是仅仅是其内容）。

```python
def object_write(obj, repo=None):
    # 序列化对象数据
    data = obj.serialize()
    # 添加头部
    result = obj.fmt + b' ' + str(len(data)).encode() + b'\x00' + data
    # 计算哈希
    sha = hashlib.sha1(result).hexdigest()

    if repo:
        # 计算路径
        path = repo_file(repo, "objects", sha[0:2], sha[2:], mkdir=True)

        if not os.path.exists(path):
            with open(path, 'wb') as f:
                # 压缩并写入
                f.write(zlib.compress(result))
    return sha
```

### 4.5. 处理 Blob

我们之前提到过，类型头可以是四种之一：`blob`、`commit`、`tag` 和 `tree`——因此 Git 有四种对象类型。

Blob 是这四种类型中最简单的一种，因为它们没有实际的格式。Blob 是用户数据：您放入 Git 中的每个文件的内容（如 `main.c`、`logo.png`、`README.md`）都作为 Blob 存储。这使得它们易于操作，因为它们除了基本的对象存储机制外没有实际的语法或约束：它们只是未指定的数据。因此，创建一个 `GitBlob` 类是微不足道的，`serialize` 和 `deserialize` 函数只需存储和返回未修改的输入即可。

```python
class GitBlob(GitObject):
    fmt = b'blob'

    def serialize(self):
        return self.blobdata

    def deserialize(self, data):
        self.blobdata = data
```

### 4.6. cat-file 命令

现在我们可以创建 `wyag cat-file` 了。`git cat-file` 只是将对象的原始内容打印到标准输出，不进行压缩并去掉 Git 头部。在 [wyag 的源代码库](https://github.com/thblt/write-yourself-a-git) 的克隆中，执行 `git cat-file blob e0695f14a412c29e252c998c81de1dde59658e4a` 将显示 README 的版本。

我们的简化版本只需接受两个位置参数：类型和对象标识符：

```example
wyag cat-file TYPE OBJECT
```

子解析器非常简单：

```python
argsp = argsubparsers.add_parser("cat-file",
                                 help="提供库对象的内容")

argsp.add_argument("type",
                   metavar="type",
                   choices=["blob", "commit", "tag", "tree"],
                   help="指定类型")

argsp.add_argument("object",
                   metavar="object",
                   help="要显示的对象")
```

我们可以实现函数，调用之前编写的现有代码：

```python
def cmd_cat_file(args):
    repo = repo_find()
    cat_file(repo, args.object, fmt=args.type.encode())

def cat_file(repo, obj, fmt=None):
    obj = object_read(repo, object_find(repo, obj, fmt=fmt))
    sys.stdout.buffer.write(obj.serialize())
```

这个函数调用了一个我们尚未介绍的 `object_find` 函数。现在，它只是返回其参数中的一个未修改的值，如下所示：

```python
def object_find(repo, name, fmt=None, follow=True):
    return name
```

这个奇怪的小函数的原因在于 Git 有很多方式来引用对象：完整哈希、短哈希、标签……`object_find()` 将是我们的名称解析函数。我们只会在 [稍后](#object_find) 实现它，所以这只是一个临时占位符。这意味着在我们实现真实功能之前，我们引用对象的唯一方式将是通过它的完整哈希。

### 4.7. hash-object 命令

不过，我们确实想在我们的仓库中放入 *自己的* 数据。`hash-object` 基本上是 `cat-file` 的反向操作：它读取一个文件，计算其哈希作为一个对象，若传递了 `-w` 标志，则将其存储在仓库中，否则仅打印其哈希。

`wyag hash-object` 的语法是 `git hash-object` 的简化版本：

```example
wyag hash-object [-w] [-t TYPE] FILE
```

对应的解析如下：

```python
argsp = argsubparsers.add_parser(
    "hash-object",
    help="计算对象 ID，并可选择从文件创建一个 blob")

argsp.add_argument("-t",
                   metavar="type",
                   dest="type",
                   choices=["blob", "commit", "tag", "tree"],
                   default="blob",
                   help="指定类型")

argsp.add_argument("-w",
                   dest="write",
                   action="store_true",
                   help="实际将对象写入数据库")

argsp.add_argument("path",
                   help="从 <file> 读取对象")
```

实际的实现非常简单。和往常一样，我们创建一个小的桥接函数：

```python
def cmd_hash_object(args):
    if args.write:
        repo = repo_find()
    else:
        repo = None

    with open(args.path, "rb") as fd:
        sha = object_hash(fd, args.type.encode(), repo)
        print(sha)
```

实际的实现也很简单。`repo` 参数是可选的，如果为 `None`，对象将不会被写入（这在上面的 `object_write()` 中处理）：

```python
def object_hash(fd, fmt, repo=None):
    """ 哈希对象，如果提供了 repo，则将其写入。"""
    data = fd.read()

    # 根据 fmt 参数选择构造函数
    match fmt:
        case b'commit' : obj=GitCommit(data)
        case b'tree'   : obj=GitTree(data)
        case b'tag'    : obj=GitTag(data)
        case b'blob'   : obj=GitBlob(data)
        case _: raise Exception("未知类型 %s!" % fmt)

    return object_write(obj, repo)
```

### 4.8. 旁白：那么，包文件呢？

我们刚刚实现的被称为“松散对象”。Git 还有一种第二种对象存储机制，叫做包文件（packfiles）。包文件比松散对象更高效，但也复杂得多。简单来说，包文件是松散对象的编译（就像 `tar`），但其中一些以增量的形式存储（作为另一个对象的变换）。包文件复杂得多，无法被 wyag 支持。

包文件存储在 `.git/objects/pack/` 中，扩展名为 `.pack`，并伴随一个同名的索引文件，扩展名为 `.idx`。如果您想将包文件转换为松散对象格式（例如，在现有仓库上使用 `wyag`），以下是解决方案。

首先，将包文件 *移动* 到 gitdir 之外（仅复制是无效的）。

``` shell
mv .git/objects/pack/pack-d9ef004d4ca729287f12aaaacf36fee39baa7c9d.pack .
```

您可以忽略 `.idx` 文件。然后，从工作树中，只需 `cat` 它并将结果管道传递给 `git unpack-objects`：

``` shell
cat pack-d9ef004d4ca729287f12aaaacf36fee39baa7c9d.pack | git unpack-objects
```

## 5\. 阅读提交历史：日志

### 5.1. 解析提交

现在我们可以读取和写入对象了，我们应该考虑提交。一个提交对象（未压缩，无头部）看起来是这样的：

```example
tree 29ff16c9c14e2652b22f8b78bb08a5a07930c147
parent 206941306e8a8af65b66eaaaea388a7ae24d49a0
author Thibault Polge <thibault@thb.lt> 1527025023 +0200
committer Thibault Polge <thibault@thb.lt> 1527025044 +0200
gpgsig -----BEGIN PGP SIGNATURE-----

 iQIzBAABCAAdFiEExwXquOM8bWb4Q2zVGxM2FxoLkGQFAlsEjZQACgkQGxM2FxoL
 kGQdcBAAqPP+ln4nGDd2gETXjvOpOxLzIMEw4A9gU6CzWzm+oB8mEIKyaH0UFIPh
 rNUZ1j7/ZGFNeBDtT55LPdPIQw4KKlcf6kC8MPWP3qSu3xHqx12C5zyai2duFZUU
 wqOt9iCFCscFQYqKs3xsHI+ncQb+PGjVZA8+jPw7nrPIkeSXQV2aZb1E68wa2YIL
 3eYgTUKz34cB6tAq9YwHnZpyPx8UJCZGkshpJmgtZ3mCbtQaO17LoihnqPn4UOMr
 V75R/7FjSuPLS8NaZF4wfi52btXMSxO/u7GuoJkzJscP3p4qtwe6Rl9dc1XC8P7k
 NIbGZ5Yg5cEPcfmhgXFOhQZkD0yxcJqBUcoFpnp2vu5XJl2E5I/quIyVxUXi6O6c
 /obspcvace4wy8uO0bdVhc4nJ+Rla4InVSJaUaBeiHTW8kReSFYyMmDCzLjGIu1q
 doU61OM3Zv1ptsLu3gUE6GU27iWYj2RWN3e3HE4Sbd89IFwLXNdSuM0ifDLZk7AQ
 WBhRhipCCgZhkj9g2NEk7jRVslti1NdN5zoQLaJNqSwO1MtxTmJ15Ksk3QP6kfLB
 Q52UWybBzpaP9HEd4XnR+HuQ4k2K0ns2KgNImsNvIyFwbpMUyUWLMPimaV1DWUXo
 5SBjDB/V/W2JBFR+XKHFJeFwYhj7DD/ocsGr4ZMx/lgc8rjIBkI=
 =lgTX
 -----END PGP SIGNATURE-----

Create first draft
```

该格式是邮件消息的简化版本，具体参见 [RFC 2822](https://www.ietf.org/rfc/rfc2822.txt)。它以一系列键值对开始，使用空格作为键/值分隔符，以提交信息结束，该信息可能跨越多行。值可以继续在多行中，后续行以空格开头，解析器必须忽略这些空格（就像上面的`gpgsig`字段，跨越了 16 行）。

让我们来看一下这些字段：

   - `tree` 是对树对象的引用，这是一种我们将在接下来的内容中看到的对象类型。树将 blob 的 ID 映射到文件系统位置，并描述工作树的状态。简单来说，它就是提交的实际内容：文件内容以及它们的位置。
   - `parent` 是对此提交的父提交的引用。它可以重复出现：例如，合并提交有多个父提交。它也可以缺失：一个仓库中的第一个提交显然没有父提交。
   - `author` 和 `committer` 是分开的，因为提交的作者不一定是可以提交此内容的人（这对于 GitHub 用户来说可能不明显，但很多项目通过电子邮件进行 Git 操作）。
   - `gpgsig` 是该对象的 PGP 签名。

我们将首先编写一个简单的解析器来处理该格式。代码是显而易见的。我们即将创建的函数名称`kvlm_parse()`可能会令人困惑：它之所以不叫`commit_parse()`是因为标签具有相同的格式，因此我们将为这两种对象类型使用它。我使用 KVLM 来表示“带消息的键值列表”。

```python
def kvlm_parse(raw, start=0, dct=None):
    if not dct:
        dct = collections.OrderedDict()
        # 你不能将参数声明为 dct=OrderedDict()，否则
        # 所有对该函数的调用将无限增长相同的字典。

    # 这个函数是递归的：它读取一个键值对，然后
    # 用新的位置调用自身。所以我们首先需要知道
    # 我们的位置：是在关键字处，还是已经在消息中。

    # 我们搜索下一个空格和下一个换行符。
    spc = raw.find(b' ', start)
    nl = raw.find(b'\n', start)

    # 如果空格出现在换行符之前，我们就有一个关键字。
    # 否则，它就是最终的消息，我们将其读取到文件末尾。

    # 基本情况
    # =========
    # 如果换行符先出现（或者根本没有空格，在这种情况下 find 返回 -1），
    # 我们假设是一个空行。空行意味着剩余数据就是消息。
    # 我们将其存储在字典中，键为 None，并返回。
    if (spc < 0) or (nl < spc):
        assert nl == start
        dct[None] = raw[start+1:]
        return dct

    # 递归情况
    # ==============
    # 我们读取一个键值对，并递归处理下一个。
    key = raw[start:spc]

    # 找到值的结尾。续行以空格开头，因此我们循环直到找到一个
    # 不以空格跟随的换行符。
    end = start
    while True:
        end = raw.find(b'\n', end+1)
        if raw[end+1] != ord(' '): break

    # 获取值
    # 同时，去掉续行前面的空格
    value = raw[spc+1:end].replace(b'\n ', b'\n')

    # 不要覆盖已有的数据内容
    if key in dct:
        if type(dct[key]) == list:
            dct[key].append(value)
        else:
            dct[key] = [ dct[key], value ]
    else:
        dct[key] = value

    return kvlm_parse(raw, start=end+1, dct=dct)
```

**对象身份规则**

我们使用 `OrderedDict`（一个有序的字典/哈希表）来确保字段总是以相同的顺序出现。这很重要，因为 Git 有**两个关于对象身份的强规则**：

1. 第一个规则是 **相同的名称将始终引用相同的对象**。我们已经见过这个规则，它只是对象名称是其内容哈希值的结果。
2. 第二个规则则略有不同：**相同的对象将始终通过相同的名称引用**。这意味着不应该有两个等价的对象使用不同的名称。这就是字段顺序重要的原因：通过修改给定提交中字段出现的*顺序*，例如将 `tree` 放在 `parent` 后面，我们会修改提交的 SHA-1 哈希，从而创建两个等价但数值不同的提交对象。

例如，在比较树时，Git 会假设具有不同名称的两棵树*是*不同的——这就是为什么我们必须确保树对象的元素正确排序，以免生成不同但等价的树。

我们还需要编写类似的对象，因此让我们向工具箱中添加一个 `kvlm_serialize()` 函数。这非常简单：我们首先输出所有字段，然后是一行换行，接着是消息，最后再加一个换行。

```python
def kvlm_serialize(kvlm):
    ret = b''

    # 输出字段
    for k in kvlm.keys():
        # 跳过消息本身
        if k is None: continue
        val = kvlm[k]
        # 归一化为列表
        if type(val) != list:
            val = [val]

        for v in val:
            ret += k + b' ' + (v.replace(b'\n', b'\n ')) + b'\n'

    # 附加消息
    ret += b'\n' + kvlm[None] + b'\n'

    return ret
```

### 5.2. 提交对象

现在我们有了解析器，可以创建 `GitCommit` 类：

```python
class GitCommit(GitObject):
    fmt = b'commit'

    def deserialize(self, data):
        self.kvlm = kvlm_parse(data)

    def serialize(self):
        return kvlm_serialize(self.kvlm)

    def init(self):
        self.kvlm = dict()
```

### 5.3. 日志命令

我们将实现一个比 Git 提供的 `log` 简单得多的版本。最重要的是，我们不会处理日志的表示，而是将 Graphviz 数据输出，让用户使用 `dot` 来渲染实际的日志。（如果你不知道如何使用 Graphviz，只需将原始输出粘贴到 [这个网站](https://dreampuf.github.io/GraphvizOnline/)。如果链接失效，请在你喜欢的搜索引擎中搜索“graphviz online”）

```python
argsp = argsubparsers.add_parser("log", help="显示给定提交的历史。")
argsp.add_argument("commit",
                   default="HEAD",
                   nargs="?",
                   help="开始的提交。")
```

```python
def cmd_log(args):
    repo = repo_find()

    print("digraph wyaglog{")
    print("  node[shape=rect]")
    log_graphviz(repo, object_find(repo, args.commit), set())
    print("}")

def log_graphviz(repo, sha, seen):
    if sha in seen:
        return
    seen.add(sha)

    commit = object_read(repo, sha)
    short_hash = sha[0:8]
    message = commit.kvlm[None].decode("utf8").strip()
    message = message.replace("\\", "\\\\")
    message = message.replace("\"", "\\\"")

    if "\n" in message:  # 只保留第一行
        message = message[:message.index("\n")]

    print("  c_{0} [label=\"{1}: {2}\"]".format(sha, sha[0:7], message))
    assert commit.fmt == b'commit'

    if not b'parent' in commit.kvlm.keys():
        # 基本情况：初始提交。
        return

    parents = commit.kvlm[b'parent']

    if type(parents) != list:
        parents = [parents]

    for p in parents:
        p = p.decode("ascii")
        print("  c_{0} -> c_{1};".format(sha, p))
        log_graphviz(repo, p, seen)
```

你现在可以像这样使用我们的日志命令：

```shell
wyag log e03158242ecab460f31b0d6ae1642880577ccbe8 > log.dot
dot -O -Tpdf log.dot
```

### 5.4. 提交的结构

你可能注意到了一些事情。

首先，我们一直在处理提交，浏览和遍历提交对象，构建提交历史的图，而从未接触工作树中的任何文件或 blob。我们在不考虑内容的情况下做了很多关于提交的工作。这一点很重要：工作树的内容只是提交的一部分。但一个提交包含了它所持有的一切：它的内容、它的作者，**还有它的父提交**。如果你记得一个提交的 ID（SHA-1 哈希）是从整个提交对象计算得出的，你就会明白提交是不可变的含义：如果你改变作者、父提交或单个文件，你实际上创建了一个新的、不同的对象。每个提交都与它的位置及其与整个仓库的关系紧密相连，直到第一个提交。换句话说，给定的提交 ID 不仅识别某些文件内容，还将提交与其整个历史和整个仓库绑定在一起。

值得注意的是，从提交的角度来看，时间在某种程度上是倒流的：我们习惯于从一个项目的谦卑起点开始考虑历史，起初只是一些代码行、一些初始提交，然后逐步发展到现在的状态（数百万行代码、数十个贡献者等）。但每个提交完全无视其未来，它只与过去相连。提交有“记忆”，但没有预知。

那么，什么构成一个提交呢？总结如下：

- 一个树对象，即工作树的内容，文件和目录；
- 零个、一个或多个父提交；
- 作者身份（姓名和电子邮件）及时间戳；
- 提交者身份（姓名和电子邮件）及时间戳；
- 一个可选的 PGP 签名；
- 一条消息；

所有这些共同哈希成一个唯一的 SHA-1 标识符。

**等等，这是不是意味着 Git 是区块链？**

由于加密货币的缘故，区块链如今备受关注。是的，*在某种程度上*，Git 是一种区块链：它是一个通过加密手段连接在一起的块（提交）序列，保证每个元素都与结构的整个历史相关联。不过，不要太认真地看待这个比较：我们不需要 GitCoin。真的，我们不需要。

## 6. 读取提交数据：检出

虽然提交包含了比给定状态下的文件和目录更多的信息，但这并不使它们真正有用。现在可能是时候开始实现树对象了，这样我们就能将提交检出到工作树中。

### 6.1. 树中有什么？

非正式地说，树描述了工作树的内容，也就是说，它将 blobs 关联到路径。它是由三个元素的元组组成的数组，每个元组包含一个文件模式、一个相对于工作树的路径和一个 SHA-1。一个典型的树内容可能看起来像这样：

<table>
<thead>
<tr class="header">
<th>文件模式</th>
<th>SHA-1</th>
<th>路径</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><code>100644</code></td>
<td><code>894a44cc066a027465cd26d634948d56d13af9af</code></td>
<td><code>.gitignore</code></td>
</tr>
<tr class="even">
<td><code>100644</code></td>
<td><code>94a9ed024d3859793618152ea559a168bbcbb5e2</code></td>
<td><code>LICENSE</code></td>
</tr>
<tr class="odd">
<td><code>100644</code></td>
<td><code>bab489c4f4600a38ce6dbfd652b90383a4aa3e45</code></td>
<td><code>README.md</code></td>
</tr>
<tr class="even">
<td><code>100644</code></td>
<td><code>6d208e47659a2a10f5f8640e0155d9276a2130a9</code></td>
<td><code>src</code></td>
</tr>
<tr class="odd">
<td><code>040000</code></td>
<td><code>e7445b03aea61ec801b20d6ab62f076208b7d097</code></td>
<td><code>tests</code></td>
</tr>
<tr class="even">
<td><code>040000</code></td>
<td><code>d5ec863f17f3a2e92aa8f6b66ac18f7b09fd1b38</code></td>
<td><code>main.c</code></td>
</tr>
</tbody>
</table>

模式只是文件的 [模式](https://en.wikipedia.org/wiki/File_system_permissions)，路径是它的位置。SHA-1 可能指向一个 blob 或另一个树对象。如果是 blob，路径就是文件；如果是树，则是目录。为了在文件系统中实例化这个树，我们将首先加载与第一个路径（`.gitignore`）相关联的对象，并检查它的类型。由于它是一个 blob，我们将创建一个名为 `.gitignore` 的文件，内容为这个 blob 的内容；对 `LICENSE` 和 `README.md` 也是如此。但与 `src` 相关联的对象不是一个 blob，而是另一个树：我们将创建目录 `src`，并在该目录中用新的树重复相同的操作。

**路径是单一的文件系统条目**

路径精确地标识一个文件或目录。不是两个，也不是三个。如果你有五层嵌套的目录，即使四个目录是空的，只有下一个目录有内容，你也需要五个树对象递归地相互引用。你不能通过将完整路径放在单个树条目中来走捷径，例如 `dir1/dir2/dir3/dir4/dir5`。

### 6.2. 解析树对象

与标签和提交不同，树对象是二进制对象，但它们的格式实际上非常简单。一个树是格式记录的串联，格式如下：

```example
[mode] 空格 [path] 0x00 [sha-1]
```

- `[mode]` 是最多六个字节，表示文件 **模式** 的八进制表示，存储为 ASCII。例如，100644 被编码为字节值 49（ASCII “1”）、48（ASCII “0”）、48、54、52、52。前两位数字编码文件类型（文件、目录、符号链接或子模块），最后四位表示权限。
- 接下来是 0x20，一个 ASCII **空格**；
- 然后是以空字符（0x00）终止的 **路径**；
- 最后是对象的 **SHA-1** 以二进制编码，长度为 20 字节。

解析器将会非常简单。首先，为单个记录（一个叶子，一个路径）创建一个小的对象包装：

```python
class GitTreeLeaf(object):
    def __init__(self, mode, path, sha):
        self.mode = mode
        self.path = path
        self.sha = sha
```

由于树对象只是相同基本数据结构的重复，我们将解析器写成两个函数。首先是提取单个记录的解析器，它返回解析的数据和在输入数据中达到的位置：

```python
def tree_parse_one(raw, start=0):
    # 查找模式的空格终止符
    x = raw.find(b' ', start)
    assert x - start == 5 or x - start == 6

    # 读取模式
    mode = raw[start:x]
    if len(mode) == 5:
        # 标准化为六个字节。
        mode = b" " + mode

    # 查找路径的 NULL 终止符
    y = raw.find(b'\x00', x)
    # 读取路径
    path = raw[x + 1:y]

    # 读取 SHA 并转换为十六进制字符串
    sha = format(int.from_bytes(raw[y + 1:y + 21], "big"), "040x")
    return y + 21, GitTreeLeaf(mode, path.decode("utf8"), sha)
```

接下来是“真正”的解析器，它在循环中调用前一个解析器，直到输入数据被耗尽。

```python
def tree_parse(raw):
    pos = 0
    max = len(raw)
    ret = list()
    while pos < max:
        pos, data = tree_parse_one(raw, pos)
        ret.append(data)

    return ret
```

我们最终需要一个序列化器来将树写回。因为我们可能已经添加或修改了条目，所以需要重新对它们进行排序。一致的排序很重要，因为我们需要遵循 Git 的 [身份规则](#org78b0903)，即没有两个等效对象可以有不同的哈希——但同样内容的不同排序的树 *会* 是等效的（描述相同的目录结构），同时仍然是数值上不同的（不同的 SHA-1 标识符）。排序不正确的树是无效的，但 *Git 并不强制执行这一点*。在编写 wyag 时，我意外创建了一些无效树，结果在 `git status` 中遇到了奇怪的错误（具体来说，`status` 会报告实际干净的工作区为完全修改）。我们不希望发生这种情况。

排序函数非常简单，但有一个意外的变化。条目按名称字母顺序排序，*但* 目录（即树条目）则添加了最终的 `/` 进行排序。这很重要，因为这意味着如果 `whatever` 是一个常规文件，它会在 `whatever.c` 之前排序，但如果 `whatever` 是一个目录，它会在之后排序，表现为 `whatever/`。（我不确定为什么 Git 这样做。如果你感兴趣，可以查看 Git 源代码中的 `tree.c` 文件中的 `base_name_compare` 函数。）

```python
# 注意这不是比较函数，而是转换函数。
# Python 的默认排序不接受自定义比较函数，
# 和大多数语言不同，而是接受返回新值的 `key` 参数，
# 该值使用默认规则进行比较。所以我们只是返回
# 叶子名称，如果是目录则多加一个 /。
def tree_leaf_sort_key(leaf):
    if leaf.mode.startswith(b"10"):
        return leaf.path
    else:
        return leaf.path + "/"
```

然后是序列化器本身。这个非常简单：我们使用新创建的函数作为转换器对条目进行排序，然后按顺序写入它们。

```python
def tree_serialize(obj):
    obj.items.sort(key=tree_leaf_sort_key)
    ret = b''
    for i in obj.items:
        ret += i.mode
        ret += b' '
        ret += i.path.encode("utf8")
        ret += b'\x00'
        sha = int(i.sha, 16)
        ret += sha.to_bytes(20, byteorder="big")
    return ret
```

现在我们只需将所有这些组合成一个类：

```python
class GitTree(GitObject):
    fmt=b'tree'

    def deserialize(self, data):
        self.items = tree_parse(data)

    def serialize(self):
        return tree_serialize(self)

    def init(self):
        self.items = list()
```

### 6.3. 显示树：ls-tree

既然我们在这方面，不妨给 wyag 添加`ls-tree`命令。这非常简单，没有理由不这样做。`git ls-tree [-r] TREE`简单地打印树的内容，使用`-r`标志时递归显示。在递归模式下，它不显示子树，只显示最终对象及其完整路径。

```python
argsp = argsubparsers.add_parser("ls-tree", help="美观地打印树对象。")
argsp.add_argument("-r",
                   dest="recursive",
                   action="store_true",
                   help="递归进入子树")

argsp.add_argument("tree",
                   help="一个树状对象。")

def cmd_ls_tree(args):
    repo = repo_find()
    ls_tree(repo, args.tree, args.recursive)

def ls_tree(repo, ref, recursive=None, prefix=""):
    sha = object_find(repo, ref, fmt=b"tree")
    obj = object_read(repo, sha)
    for item in obj.items:
        if len(item.mode) == 5:
            type = item.mode[0:1]
        else:
            type = item.mode[0:2]

        match type: # 确定类型。
            case b'04': type = "tree"
            case b'10': type = "blob" # 常规文件。
            case b'12': type = "blob" # 符号链接。Blob 内容是链接目标。
            case b'16': type = "commit" # 子模块
            case _: raise Exception("奇怪的树叶模式 {}".format(item.mode))

        if not (recursive and type=='tree'): # 这是一个叶子
            print("{0} {1} {2}\t{3}".format(
                "0" * (6 - len(item.mode)) + item.mode.decode("ascii"),
                # Git 的 ls-tree 显示指向对象的类型。
                # 我们也可以这样做 :)
                type,
                item.sha,
                os.path.join(prefix, item.path)))
        else: # 这是一个分支，递归
            ls_tree(repo, item.sha, recursive, os.path.join(prefix, item.path))
```

### 6.4. checkout 命令

`git checkout` 只是将一个提交实例化到工作区。我们将简化实际的 git 命令，以便让我们的实现更加清晰和易于理解。同时，我们将添加一些安全措施。以下是我们版本的 checkout 的工作方式：

- 它将接受两个参数：一个提交和一个目录。Git checkout 只需要一个提交。
- 然后它将在目录中实例化树，**仅当目录为空时**。Git 充满了避免删除数据的安全措施，而在 wyag 中重现这些措施太复杂且不安全。由于 wyag 的目的是演示 git，而不是生成一个实际的实现，这个限制是可以接受的。

让我们开始吧。像往常一样，我们需要一个子解析器：

```python
argsp = argsubparsers.add_parser("checkout", help="在一个目录中签出一个提交。")

argsp.add_argument("commit",
                   help="要签出的提交或树。")

argsp.add_argument("path",
                   help="要签出的空目录。")
```

包装函数：

```python
def cmd_checkout(args):
    repo = repo_find()

    obj = object_read(repo, object_find(repo, args.commit))

    # 如果对象是一个提交，我们获取它的树
    if obj.fmt == b'commit':
        obj = object_read(repo, obj.kvlm[b'tree'].decode("ascii"))

    # 验证路径是否是一个空目录
    if os.path.exists(args.path):
        if not os.path.isdir(args.path):
            raise Exception("不是目录 {0}！".format(args.path))
        if os.listdir(args.path):
            raise Exception("不是空的 {0}！".format(args.path))
    else:
        os.makedirs(args.path)

    tree_checkout(repo, obj, os.path.realpath(args.path))
```

实际工作的函数：

```python
def tree_checkout(repo, tree, path):
    for item in tree.items:
        obj = object_read(repo, item.sha)
        dest = os.path.join(path, item.path)

        if obj.fmt == b'tree':
            os.mkdir(dest)
            tree_checkout(repo, obj, dest)
        elif obj.fmt == b'blob':
            # @TODO 支持符号链接（通过模式 12**** 识别）
            with open(dest, 'wb') as f:
                f.write(obj.blobdata)
```

## 7\. 引用、标签和分支

### 7.1. 什么是引用，以及 show-ref 命令

到目前为止，我们引用对象的唯一方式是通过它们的完整十六进制标识符。在 Git 中，实际上我们很少直接看到这些标识符，除非是在谈论特定的提交。但通常情况下，我们讨论的是 HEAD，或者一些名为 `main` 或 `feature/more-bombs` 的分支等等。这一切都是通过一种简单的机制称为引用来实现的。

Git 引用，简称 refs，可能是 Git 中保存的最简单类型的对象。它们位于 `.git/refs` 的子目录中，包含以 ASCII 编码的对象哈希的十六进制表示。这些引用实际上就是这样简单：

```example
6071c08bcb4757d8c89a30d9755d2466cef8c1de
```

此外，refs 还可以引用另一个引用，从而间接地引用一个对象，在这种情况下，它们的格式如下：

```example
ref: refs/remotes/origin/master
```

**直接引用和间接引用**

从现在开始，我将把形如 `ref: path/to/other/ref` 的引用称为**间接引用**，而带有 SHA-1 对象 ID 的引用称为**直接引用**。

本节将描述引用的用途。现在，重要的是以下几点：

- 它们是位于 `.git/refs` 目录中的文本文件；
- 它们保存一个对象的 SHA-1 标识符，或者对另一个引用的引用，最终指向一个 SHA-1（没有循环！）

为了处理引用，我们首先需要一个简单的递归解析器，它将接受一个引用名称，跟踪可能的递归引用（内容以 `ref:` 开头的引用，如上所示），并返回一个 SHA-1 标识符：

```python
def ref_resolve(repo, ref):
    path = repo_file(repo, ref)

    # 有时，间接引用可能会损坏。这在一种特定情况下是正常的：
    # 我们在一个没有提交的新仓库中查找 HEAD。在这种情况下，
    # .git/HEAD 指向 "ref: refs/heads/main"，但 .git/refs/heads/main
    # 还不存在（因为没有提交可以引用它）。
    if not os.path.isfile(path):
        return None

    with open(path, 'r') as fp:
        data = fp.read()[:-1]
        # 去掉最后的 \n ^^^^^
    if data.startswith("ref: "):
        return ref_resolve(repo, data[5:])
    else:
        return data
```

让我们创建两个小函数，并实现 `show-refs` 命令——它只是列出一个仓库中的所有引用。首先，一个简单的递归函数来收集引用并将其作为字典返回：

```python
def ref_list(repo, path=None):
    if not path:
        path = repo_dir(repo, "refs")
    ret = collections.OrderedDict()
    # Git 显示的引用是排序的。为了实现同样的效果，我们使用
    # OrderedDict 并对 listdir 的输出进行排序
    for f in sorted(os.listdir(path)):
        can = os.path.join(path, f)
        if os.path.isdir(can):
            ret[f] = ref_list(repo, can)
        else:
            ret[f] = ref_resolve(repo, can)

    return ret
```

和往常一样，我们需要一个子解析器，一个桥接函数，以及一个（递归）工作函数：

```python
argsp = argsubparsers.add_parser("show-ref", help="列出引用。")

def cmd_show_ref(args):
    repo = repo_find()
    refs = ref_list(repo)
    show_ref(repo, refs, prefix="refs")

def show_ref(repo, refs, with_hash=True, prefix=""):
    for k, v in refs.items():
        if type(v) == str:
            print("{0}{1}{2}".format(
                v + " " if with_hash else "",
                prefix + "/" if prefix else "",
                k))
        else:
            show_ref(repo, v, with_hash=with_hash, prefix="{0}{1}{2}".format(prefix, "/" if prefix else "", k))
```

### 7.2. 标签作为引用

引用的最简单用法就是标签。标签只是对象（通常是提交）的用户定义名称。标签的一个常见用途是标识软件版本：假设你刚刚合并了你程序的版本 12.78.52 的最后一次提交，所以你最近的提交（我们称之为 `6071c08`）*就是* 你的版本 12.78.52。为了明确这个关联，你只需执行以下命令：

```shell
git tag v12.78.52 6071c08
# 此处的对象哈希 ^可选，默认为 HEAD。
```

这将创建一个名为 `v12.78.52` 的新标签，指向 `6071c08`。标签就像别名：标签为现有对象提供了一种新的引用方式。创建标签后，名称 `v12.78.52` 就指向 `6071c08`。例如，这两个命令现在是完全等效的：

```shell
git checkout v12.78.52
git checkout 6071c08
```

版本是标签的一个常见用途，但就像 Git 中几乎所有事物一样，标签没有预定义的语义：它们可以根据你的需求而定，并可以指向任何你想要的对象，甚至可以给 *blob* 打标签！

### 7.3. 轻量标签和标签对象，以及解析标签对象

你可能已经猜到了，标签实际上就是引用。它们位于 `.git/refs/tags/` 目录中。唯一值得注意的是，标签有两种类型：轻量标签和标签对象。

- **轻量标签**  
  只是指向提交、树或 blob 的常规引用。
  
- **标签对象**  
  是指向类型为 `tag` 的对象的常规引用。与轻量标签不同，标签对象具有作者、日期、可选的 PGP 签名和可选的注释。它们的格式与提交对象相同。

我们甚至不需要实现标签对象，可以重用 `GitCommit` 并只需更改 `fmt` 字段：

```python
class GitTag(GitCommit):
    fmt = b'tag'
```

现在我们就支持标签了。

### 7.4. tag 命令

让我们添加 `tag` 命令。在 Git 中，它有两个功能：创建一个新标签或列出现有标签（默认情况下）。因此，你可以这样调用它：

```shell
git tag                  # 列出所有标签
git tag NAME [OBJECT]    # 创建一个新的 *轻量* 标签 NAME，指向
                         # HEAD（默认）或 OBJECT
git tag -a NAME [OBJECT] # 创建一个新的标签 *对象* NAME，指向
                         # HEAD（默认）或 OBJECT
```

这在 argparse 中的翻译如下。请注意，我们忽略了 `--list` 和 `[-a] name [object]` 之间的互斥关系，因为这对 argparse 来说似乎太复杂了。

```python
argsp = argsubparsers.add_parser(
    "tag",
    help="列出和创建标签")

argsp.add_argument("-a",
                   action="store_true",
                   dest="create_tag_object",
                   help="是否创建标签对象")

argsp.add_argument("name",
                   nargs="?",
                   help="新标签的名称")

argsp.add_argument("object",
                   default="HEAD",
                   nargs="?",
                   help="新标签将指向的对象")
```

`cmd_tag` 函数将根据是否提供 `name` 来分发行为（列出或创建）。

```python
def cmd_tag(args):
    repo = repo_find()

    if args.name:
        tag_create(repo,
                   args.name,
                   args.object,
                   type="object" if args.create_tag_object else "ref")
    else:
        refs = ref_list(repo)
        show_ref(repo, refs["tags"], with_hash=False)
```

我们只需要再添加一个函数来实际创建标签：

```python
def tag_create(repo, name, ref, create_tag_object=False):
    # 从对象引用获取 GitObject
    sha = object_find(repo, ref)

    if create_tag_object:
        # 创建标签对象（提交）
        tag = GitTag(repo)
        tag.kvlm = collections.OrderedDict()
        tag.kvlm[b'object'] = sha.encode()
        tag.kvlm[b'type'] = b'commit'
        tag.kvlm[b'tag'] = name.encode()
        # 可以让用户提供他们的名字！
        # 注意，你可以在提交后修复这个问题，继续阅读！
        tag.kvlm[b'tagger'] = b'Wyag <wyag@example.com>'
        # …并添加标签消息！
        tag.kvlm[None] = b"由 wyag 生成的标签，无法自定义消息！"
        tag_sha = object_write(tag)
        # 创建引用
        ref_create(repo, "tags/" + name, tag_sha)
    else:
        # 创建轻量标签（引用）
        ref_create(repo, "tags/" + name, sha)

def ref_create(repo, ref_name, sha):
    with open(repo_file(repo, "refs/" + ref_name), 'w') as fp:
        fp.write(sha + "\n")
```

### 7.5. 什么是分支？

标签的部分完成了。现在进入另一个重要的部分：分支。

是时候解决这个关键问题了：和大多数 Git 用户一样，wyag 目前对分支的概念仍然模糊。它将一个仓库视为一堆无序的对象，其中一些是提交，但完全没有表示提交是如何分组在分支中的，以及在任何时刻都有一个提交是 `HEAD`，即 **活动** 分支的 **头部** 提交（或“尖端”）。

那么，分支是什么呢？答案实际上出乎意料地简单，但也可能令人惊讶：**分支是对提交的引用**。你甚至可以说，分支是一种对提交的名称。从这个意义上说，分支与标签是完全一样的。标签是存放在 `.git/refs/tags` 中的引用，分支是存放在 `.git/refs/heads` 中的引用。

当然，分支和标签之间是有区别的：

1. 分支是指向 *提交* 的引用，而标签可以指向任何对象；
2. 最重要的是，分支引用在每次提交时都会更新。这意味着每当你提交时，Git 实际上会执行以下操作：
   1. 创建一个新的提交对象，其父对象是当前分支的（提交！）ID；
   2. 哈希化并存储提交对象；
   3. 更新分支引用，以指向新提交的哈希。

就这些。

那么 **当前** 分支呢？实际上更简单。它是位于 `refs` 层级之外的一个引用文件，位于 `.git/HEAD`，这是一个 **间接** 引用（即，它的形式是 `ref: path/to/other/ref`，而不是简单的哈希）。

**分离的 HEAD**

当你检出一个随机提交时，Git 会警告你处于“分离的 HEAD 状态”。这意味着你不再处于任何分支中。在这种情况下，`.git/HEAD` 是一个 **直接** 引用：它包含一个 SHA-1。

### 7.6. 引用对象：`object_find` 函数

#### 7.6.1. 解析名称

还记得我们创建的那个“愚蠢的 `object_find` 函数”吗？它接受四个参数，返回第二个参数不变并忽略其他三个。现在是时候用更有用的东西来替换它了。我们将实现一个小而可用的实际 Git 名称解析算法的子集。新的 `object_find()` 将分两步工作：首先，给定一个名称，它将返回一个完整的 SHA-1 哈希。例如，使用 `HEAD`，它将返回当前分支的头部提交的哈希，等等。更精确地说，这个名称解析函数的工作方式如下：

  - 如果 `name` 是 `HEAD`，它将解析 `.git/HEAD`；
  - 如果 `name` 是完整的哈希，则返回该哈希不变。
  - 如果 `name` 看起来像一个短哈希，它将收集完整哈希以此短哈希开头的对象。
  - 最后，它将解析与名称匹配的标签和分支。

请注意最后两步是如何 *收集* 值的：前两步是绝对引用，因此我们可以安全地返回结果。但短哈希或分支名称可能是模糊的，我们希望枚举名称的所有可能含义，并在找到多个结果时抛出错误。

**短哈希**

为了方便，Git 允许通过名称的前缀来引用哈希。例如，`5bd254aa973646fa16f66d702a5826ea14a3eb45` 可以被称为 `5bd254`。这被称为“短哈希”。

```python
def object_resolve(repo, name):
    """将名称解析为 repo 中的对象哈希。

此函数支持：

 - HEAD 字面量
 - 短哈希和长哈希
 - 标签
 - 分支
 - 远程分支"""
    candidates = list()
    hashRE = re.compile(r"^[0-9A-Fa-f]{4,40}$")

    # 空字符串？终止。
    if not name.strip():
        return None

    # HEAD 是明确的
    if name == "HEAD":
        return [ ref_resolve(repo, "HEAD") ]

    # 如果是十六进制字符串，尝试查找哈希。
    if hashRE.match(name):
        # 这可能是一个哈希，可能是短的或完整的。4 是 Git 认为某个东西是短哈希的最小长度。
        # 这个限制在 man git-rev-parse 中有说明。
        name = name.lower()
        prefix = name[0:2]
        path = repo_dir(repo, "objects", prefix, mkdir=False)
        if path:
            rem = name[2:]
            for f in os.listdir(path):
                if f.startswith(rem):
                    # 注意字符串的 startswith() 本身适用于完整哈希。
                    candidates.append(prefix + f)

    # 尝试查找引用。
    as_tag = ref_resolve(repo, "refs/tags/" + name)
    if as_tag:  # 找到了标签吗？
        candidates.append(as_tag)

    as_branch = ref_resolve(repo, "refs/heads/" + name)
    if as_branch:  # 找到了分支吗？
        candidates.append(as_branch)

    return candidates
```

第二步是跟随我们找到的对象到所需类型的对象，如果提供了类型参数。由于我们只需处理简单的情况，这个过程非常简单且是迭代的：

- 如果我们有一个标签而 `fmt` 是其他任何值，我们就跟随这个标签。
- 如果我们有一个提交而 `fmt` 是 tree，我们返回这个提交的树对象。
- 在其他情况下，我们退出：没有其他的情况有意义。

（这个过程是迭代的，因为可能需要不确定的步骤，因为标签本身可以被标记）

```python
def object_find(repo, name, fmt=None, follow=True):
      sha = object_resolve(repo, name)

      if not sha:
          raise Exception("没有这样的引用 {0}.".format(name))

      if len(sha) > 1:
          raise Exception("模糊的引用 {0}：候选项为：\n - {1}.".format(name, "\n - ".join(sha)))

      sha = sha[0]

      if not fmt:
          return sha

      while True:
          obj = object_read(repo, sha)
          #     ^^^^^^^^^^^ < 这有点激进：我们读取整个对象只是为了获取它的类型。
          # 而且我们在一个循环中这样做，尽管通常很短。这里不期望高性能。

          if obj.fmt == fmt:
              return sha

          if not follow:
              return None

          # 跟随标签
          if obj.fmt == b'tag':
                sha = obj.kvlm[b'object'].decode("ascii")
          elif obj.fmt == b'commit' and fmt == b'tree':
                sha = obj.kvlm[b'tree'].decode("ascii")
          else:
              return None
```

通过新的 `object_find()`，CLI wyag 变得更加可用。你现在可以做一些这样的事情：

```example
$ wyag checkout v3.11 # 一个标签
$ wyag checkout feature/explosions # 一个分支
$ wyag ls-tree -r HEAD # 当前分支或提交。这里还有一个跟随：HEAD 实际上是一个提交。
$ wyag cat-file blob e0695f # 一个短哈希
$ wyag cat-file tree master # 一个分支，作为树（另一个“跟随”）
```

#### 7.6.2. rev-parse 命令

让我们实现 `wyag rev-parse`。`git rev-parse` 命令做了很多事情，但我们要克隆的用例是解析引用。为了进一步测试 `object_find` 的“跟随”功能，我们将在其接口中添加一个可选的 `wyag-type` 参数。

```python
argsp = argsubparsers.add_parser(
    "rev-parse",
    help="解析修订版（或其他对象）标识符")

argsp.add_argument("--wyag-type",
                   metavar="type",
                   dest="type",
                   choices=["blob", "commit", "tag", "tree"],
                   default=None,
                   help="指定预期的类型")

argsp.add_argument("name",
                   help="要解析的名称")
```

桥接函数完成所有工作：

```python
def cmd_rev_parse(args):
    if args.type:
        fmt = args.type.encode()
    else:
        fmt = None

    repo = repo_find()

    print(object_find(repo, args.name, fmt, follow=True))
```

并且它可以正常工作：

```example
$ wyag rev-parse --wyag-type commit HEAD
6c22393f5e3830d15395fd8d2f8b0cf8eb40dd58
$ wyag rev-parse --wyag-type tree HEAD
11d33fad71dbac72840aff1447e0d080c7484361
$ wyag rev-parse --wyag-type tree HEAD
None
```

## 8\. 处理暂存区和索引文件

### 8.1. 什么是索引文件？

最后一步将引导我们进入提交的实际发生地（虽然实际创建提交是在下一节！）

你可能知道，在 Git 中进行提交时，首先要“暂存”一些更改，使用 `git add` 和 `git rm`，然后才提交这些更改。最后一次提交和下一次提交之间的这个中间阶段称为 **暂存区**。

看起来自然的是使用提交或树对象来表示暂存区，但 Git 实际上使用的是一种完全不同的机制，即所谓的 **索引文件**。

在提交之后，索引文件可以看作是该提交的某种副本：它持有与对应树相同的路径/Blob 关联。但它还包含关于工作区中文件的额外信息，比如创建/修改时间，因此 `git status` 并不需要实际比较文件：它只需检查文件的修改时间是否与索引文件中存储的时间相同，只有在不相同时才会进行实际比较。

因此，你可以将索引文件视为一个三方关联列表：不仅包含路径与 Blob 的关联，还包含路径与实际文件系统条目的关联。

**索引文件** 的另一个重要特性是，与树不同，它可以表示不一致的状态，比如合并冲突，而树始终是完整且明确的表示。

当你提交时，Git 实际上是将索引文件转换为一个新的树对象。总结如下：

1. 当仓库“干净”时，索引文件包含与 HEAD 提交完全相同的内容，以及对应文件系统条目的元数据。例如，它可能包含如下内容：

    > 有一个名为 `src/disp.c` 的文件，其内容为 Blob
    > 797441c76e59e28794458b39b0f1eff4c85f4fa0。实际的 `src/disp.c`
    > 文件在工作区中创建于 2023-07-15
    > 15:28:29.168572151，最后修改于 2023-07-15
    > 15:28:29.1689427709。它存储在设备 65026，inode 8922881 上。

2. 当你使用 `git add` 或 `git rm` 时，索引文件会相应地被修改。在上述示例中，如果你修改了 `src/disp.c` 并 `add` 你的更改，索引文件将更新为新的 Blob ID（当然，Blob 本身也会在此过程中被创建），并且各种文件元数据也会被更新，以便 `git status` 知道何时不需要比较文件内容。

3. 当你将这些更改 `git commit` 时，将从索引文件生成一个新的树对象，生成一个新的提交对象，并更新分支，然后完成。

**关于术语的说明**

因此，暂存区和索引是同一个概念，但“暂存区”这个名称更像是 Git 用户可见的功能名称（可以用其他方式实现），是某种抽象；而“索引文件”则专指这一抽象功能在 Git 中的实际实现方式。

### 8.2. 解析索引

索引文件是 Git 仓库中最复杂的数据结构。其完整文档可以在 Git 源代码树的 `Documentation/gitformat-index.txt` 中找到；你可以在 [GitHub 镜像上浏览](https://github.com/git/git/blob/master/Documentation/gitformat-index.txt)。它由三部分组成：

- 一个包含格式版本号和索引条目数量的头部；
- 一系列已排序的条目，每个条目代表一个文件，填充到 8 字节的倍数；
- 一系列可选扩展，我们将忽略它们。

我们需要表示的第一件事是单个条目。它实际上包含了很多内容，具体细节将在注释中说明。值得注意的是，一个条目同时存储了与对象存储中的 blob 相关联的 SHA-1 和关于实际文件的许多元数据。这是因为 `git/wyag status` 需要确定索引中的哪些文件被修改：首先检查最后修改的时间戳并与已知值进行比较，效率更高，然后再比较实际文件。

```python
class GitIndexEntry (object):
    def __init__(self, ctime=None, mtime=None, dev=None, ino=None,
                 mode_type=None, mode_perms=None, uid=None, gid=None,
                 fsize=None, sha=None, flag_assume_valid=None,
                 flag_stage=None, name=None):
      # 文件元数据最后一次更改的时间。 这是一个对
      # （秒级时间戳，纳秒级时间戳）的元组
      self.ctime = ctime
      # 文件数据最后一次更改的时间。 这是一个对
      # （秒级时间戳，纳秒级时间戳）的元组
      self.mtime = mtime
      # 包含此文件的设备 ID
      self.dev = dev
      # 文件的 inode 编号
      self.ino = ino
      # 对象类型，可以是 b1000（常规），b1010（符号链接），
      # b1110（gitlink）。
      self.mode_type = mode_type
      # 对象权限，整数值。
      self.mode_perms = mode_perms
      # 拥有者的用户 ID
      self.uid = uid
      # 拥有者的组 ID
      self.gid = gid
      # 此对象的大小，以字节为单位
      self.fsize = fsize
      # 对象的 SHA
      self.sha = sha
      self.flag_assume_valid = flag_assume_valid
      self.flag_stage = flag_stage
      # 对象名称（这次是完整路径！）
      self.name = name
```

索引文件是一个二进制文件，可能出于性能原因。格式相对简单，它以一个包含 `DIRC` 魔术字节、版本号和索引文件中条目总数的头部开始。我们创建 `GitIndex` 类来保存这些信息：

```python
class GitIndex (object):
    version = None
    entries = []
    # ext = None
    # sha = None

    def __init__(self, version=2, entries=None):
        if not entries:
            entries = list()

        self.version = version
        self.entries = entries
```

接下来是一个解析器，将索引文件读入这些对象。在读取了 12 字节的头部后，我们按照出现的顺序解析条目。一个条目以一组固定长度的数据开始，后面跟着一个可变长度的名称。

代码相当简单，但由于它在读取二进制格式，感觉比我们之前做的要复杂一些。我们大量使用 `int.from_bytes(bytes, endianness)` 来将原始字节读入整数，并使用少量的位操作来分离共享相同字节的数据。

这个格式可能是为了让索引文件能够直接通过 `mmapp()` 映射到内存，并作为 C 结构直接读取，从而在大多数情况下以 O(n) 时间构建索引。这种方法通常会在 C 语言中产生比在 Python 中更优雅的代码……

```python
def index_read(repo):
    index_file = repo_file(repo, "index")

    # 新仓库没有索引文件！
    if not os.path.exists(index_file):
        return GitIndex()

    with open(index_file, 'rb') as f:
        raw = f.read()

    header = raw[:12]
    signature = header[:4]
    assert signature == b"DIRC"  # 代表 "DirCache"
    version = int.from_bytes(header[4:8], "big")
    assert version == 2, "wyag 仅支持索引文件版本 2"
    count = int.from_bytes(header[8:12], "big")

    entries = list()

    content = raw[12:]
    idx = 0
    for i in range(0, count):
        # 读取创建时间，作为 UNIX 时间戳（自 1970-01-01 00:00:00 起的秒数）
        ctime_s = int.from_bytes(content[idx: idx+4], "big")
        # 读取创建时间，作为该时间戳后的纳秒数，以获得额外的精度
        ctime_ns = int.from_bytes(content[idx+4: idx+8], "big")
        # 同样处理修改时间：先是从纪元起的秒数
        mtime_s = int.from_bytes(content[idx+8: idx+12], "big")
        # 然后是额外的纳秒数
        mtime_ns = int.from_bytes(content[idx+12: idx+16], "big")
        # 设备 ID
        dev = int.from_bytes(content[idx+16: idx+20], "big")
        # inode
        ino = int.from_bytes(content[idx+20: idx+24], "big")
        # 忽略的字段
        unused = int.from_bytes(content[idx+24: idx+26], "big")
        assert 0 == unused
        mode = int.from_bytes(content[idx+26: idx+28], "big")
        mode_type = mode >> 12
        assert mode_type in [0b1000, 0b1010, 0b1110]
        mode_perms = mode & 0b0000000111111111
        # 用户 ID
        uid = int.from_bytes(content[idx+28: idx+32], "big")
        # 组 ID
        gid = int.from_bytes(content[idx+32: idx+36], "big")
        # 大小
        fsize = int.from_bytes(content[idx+36: idx+40], "big")
        # SHA（对象 ID）。我们将其存储为小写的十六进制字符串，以保持一致性
        sha = format(int.from_bytes(content[idx+40: idx+60], "big"), "040x")
        # 我们将忽略的标志
        flags = int.from_bytes(content[idx+60: idx+62], "big")
        # 解析标志
        flag_assume_valid = (flags & 0b1000000000000000) != 0
        flag_extended = (flags & 0b0100000000000000) != 0
        assert not flag_extended
        flag_stage = flags & 0b0011000000000000
        # 名称的长度。这是以 12 位存储的，最大值为 0xFFF，4095。由于名称有时可能超过该长度，git 将 0xFFF 视为表示至少 0xFFF，并寻找最终的 0x00 以找到名称的结束——这会带来小而可能非常罕见的性能损失。
        name_length = flags & 0b0000111111111111

        # 到目前为止我们已经读取了 62 字节。
        idx += 62

        if name_length < 0xFFF:
            assert content[idx + name_length] == 0x00
            raw_name = content[idx:idx+name_length]
            idx += name_length + 1
        else:
            print("注意：名称长度为 0x{:X} 字节。".format(name_length))
            # 这可能没有经过足够的测试。它适用于长度恰好为 0xFFF 字节的路径。任何额外字节可能会在 git、我的 shell 和我的文件系统之间造成问题。
            null_idx = content.find(b'\x00', idx + 0xFFF)
            raw_name = content[idx:null_idx]
            idx = null_idx + 1

        # 将名称解析为 UTF-8
        name = raw_name.decode("utf8")

        # 数据按 8 字节的倍数填充以进行指针对齐，因此我们跳过需要的字节，以便下次读取从正确的位置开始。

        idx = 8 * ceil(idx / 8)

        # 然后我们将此条目添加到我们的列表中。
        entries.append(GitIndexEntry(ctime=(ctime_s, ctime_ns),
                                     mtime=(mtime_s, mtime_ns),
                                     dev=dev,
                                     ino=ino,
                                     mode_type=mode_type,
                                     mode_perms=mode_perms,
                                     uid=uid,
                                     gid=gid,
                                     fsize=fsize,
                                     sha=sha,
                                     flag_assume_valid=flag_assume_valid,
                                     flag_stage=flag_stage,
                                     name=name))

    return GitIndex(version=version, entries=entries)
```

### 8.3. ls-files 命令

`git ls-files` 显示暂存区中文件的名称，通常带有大量选项。我们的 `ls-files` 将简单得多，但我们会添加一个 `--verbose` 选项，这是 git 中不存在的，以便显示索引文件中的每一个信息。

```python
argsp = argsubparsers.add_parser("ls-files", help="列出所有暂存文件")
argsp.add_argument("--verbose", action="store_true", help="显示所有信息。")

def cmd_ls_files(args):
  repo = repo_find()
  index = index_read(repo)
  if args.verbose:
    print("索引文件格式 v{}, 包含 {} 条目。".format(index.version, len(index.entries)))

  for e in index.entries:
    print(e.name)
    if args.verbose:
      print("  {}，权限：{:o}".format(
        { 0b1000: "常规文件",
          0b1010: "符号链接",
          0b1110: "git 链接" }[e.mode_type],
        e.mode_perms))
      print("  对应的 blob: {}".format(e.sha))
      print("  创建时间：{}.{}, 修改时间：{}.{}".format(
        datetime.fromtimestamp(e.ctime[0]),
        e.ctime[1],
        datetime.fromtimestamp(e.mtime[0]),
        e.mtime[1]))
      print("  设备：{}, inode: {}".format(e.dev, e.ino))
      print("  用户：{} ({})  组：{} ({})".format(
        pwd.getpwuid(e.uid).pw_name,
        e.uid,
        grp.getgrgid(e.gid).gr_name,
        e.gid))
      print("  标志：stage={} assume_valid={}".format(
        e.flag_stage,
        e.flag_assume_valid))
```

如果你运行 ls-files，你会注意到在“干净”的工作区（未修改的 `HEAD` 检出）中，它列出了 `HEAD` 上的所有文件。再次强调，索引并不是从 `HEAD` 提交的一个*增量*（一组差异），而是以不同的格式作为它的一个副本。

### 8.4. 绕道：check-ignore 命令

我们想要编写 `status`，但 `status` 需要了解忽略规则，这些规则存储在各种 `.gitignore` 文件中。因此，我们首先需要在 `wyag` 中添加一些基本的忽略文件支持。我们将以 `check-ignore` 命令的形式暴露这一支持，该命令接受一个路径列表，并输出那些应该被忽略的路径。

命令解析器同样很简单：

```python
argsp = argsubparsers.add_parser("check-ignore", help="检查路径是否符合忽略规则。")
argsp.add_argument("path", nargs="+", help="待检查的路径")
```

函数也同样简单：

```python
def cmd_check_ignore(args):
  repo = repo_find()
  rules = gitignore_read(repo)
  for path in args.path:
      if check_ignore(rules, path):
        print(path)
```

当然，我们调用的大多数函数在 wyag 中还不存在。我们将首先编写一个读取忽略文件规则的函数 `gitignore_read()`。这些规则的语法相当简单：每行都是一个排除模式，匹配该模式的文件将被 `status`、`add -A` 等忽略。不过，有三个特殊情况：

1.  以感叹号 `!` 开头的行会 *否定* 模式（匹配该模式的文件会被 *包含*，即使它们之前被忽略）。
2.  以井号 `#` 开头的行是注释，会被跳过。
3.  行首的反斜杠 `\` 将 `!` 和 `#` 视为字面字符。

首先，单个模式的解析器。该解析器返回一对值：模式本身，以及一个布尔值，用于指示匹配该模式的文件是 *应该* 被排除 (`True`) 还是包含 (`False`)。换句话说，如果模式以 `!` 开头，则返回 `False`，否则返回 `True`。

```python
def gitignore_parse1(raw):
    raw = raw.strip()  # 去除前后空格

    if not raw or raw[0] == "#":
        return None
    elif raw[0] == "!":
        return (raw[1:], False)
    elif raw[0] == "\\":
        return (raw[1:], True)
    else:
        return (raw, True)
```

解析文件的过程就是收集该文件中的所有规则。请注意，这个函数并不解析 *文件*，而只是解析行的列表：这是因为我们也需要从 git blobs 中读取规则，而不仅仅是常规文件。

```python
def gitignore_parse(lines):
    ret = list()

    for line in lines:
        parsed = gitignore_parse1(line)
        if parsed:
            ret.append(parsed)

    return ret
```

最后，我们需要做的就是收集各种忽略文件。这些文件分为两种：

- 一些文件**位于索引中**：它们是各种 `gitignore` 文件。强调一下复数形式；虽然通常只有一个这样的文件在根目录，但每个目录中也可以有一个，并且它适用于该目录及其子目录。我称这些为**作用域文件**，因为它们只适用于其目录下的路径。
- 其他文件**位于索引之外**。它们是全局忽略文件（通常在 `~/.config/git/ignore`）和特定于仓库的 `.git/info/exclude`。我称这些为**绝对文件**，因为它们适用于所有地方，但优先级较低。

再次，我们定义一个类来持有这些信息：一个包含绝对规则的列表，以及一个包含相对规则的字典（哈希表）。这个哈希表的键是**目录**，相对于工作树的根目录。

```python
class GitIgnore(object):
    absolute = None
    scoped = None

    def __init__(self, absolute, scoped):
        self.absolute = absolute
        self.scoped = scoped
```

最后，我们的函数将收集仓库中的所有 gitignore 规则，并返回一个 `GitIgnore` 对象。请注意，它是从索引中读取作用域文件，而不是从工作树中读取：只有*已暂存*的 `.gitignore` 文件才重要（还要记住：HEAD *已经* 被暂存——暂存区是一个副本，而不是增量）。

```python
def gitignore_read(repo):
    ret = GitIgnore(absolute=list(), scoped=dict())

    # 读取 .git/info/exclude 中的本地配置
    repo_file = os.path.join(repo.gitdir, "info/exclude")
    if os.path.exists(repo_file):
        with open(repo_file, "r") as f:
            ret.absolute.append(gitignore_parse(f.readlines()))

    # 全局配置
    if "XDG_CONFIG_HOME" in os.environ:
        config_home = os.environ["XDG_CONFIG_HOME"]
    else:
        config_home = os.path.expanduser("~/.config")
    global_file = os.path.join(config_home, "git/ignore")

    if os.path.exists(global_file):
        with open(global_file, "r") as f:
            ret.absolute.append(gitignore_parse(f.readlines()))

    # 索引中的 .gitignore 文件
    index = index_read(repo)

    for entry in index.entries:
        if entry.name == ".gitignore" or entry.name.endswith("/.gitignore"):
            dir_name = os.path.dirname(entry.name)
            contents = object_read(repo, entry.sha)
            lines = contents.blobdata.decode("utf8").splitlines()
            ret.scoped[dir_name] = gitignore_parse(lines)
    return ret
```

我们快完成了。为了将所有内容结合在一起，我们需要 `check_ignore` 函数，该函数将路径（相对于工作树的根目录）与一组规则进行匹配。这个函数的工作原理如下：

- 它首先尝试将这个路径与**作用域**规则匹配。从路径的最深父级开始，向上查找。也就是说，如果路径是 `src/support/w32/legacy/sound.c~`，它将首先查找 `src/support/w32/legacy/.gitignore` 中的规则，然后是 `src/support/w32/.gitignore`，接着是 `src/support/.gitignore`，依此类推，直到根目录的 `.gitignore`。
- 如果没有匹配的规则，它将继续查找**绝对**规则。

我们写三个小支持函数。一个是将路径与一组规则进行匹配，并返回最后一个匹配规则的结果。请注意，这不是一个真实的布尔函数，因为它有**三**种可能的返回值：`True`、`False` 和 `None`。如果没有匹配，则返回 `None`，这样调用者就知道应该继续尝试更一般的忽略文件（例如，向上移动一级目录）。

```python
def check_ignore1(rules, path):
    result = None
    for (pattern, value) in rules:
        if fnmatch(path, pattern):
            result = value
    return result
```

另一个函数用于与**作用域**规则（各种 `.gitignore` 文件）的字典进行匹配。它从路径的目录开始，递归向上移动到父目录，直到测试到根目录。请注意，这个函数（以及接下来的两个函数）从不在给定的 `.gitignore` 文件**内部**中中断。即使某个规则匹配，它们仍会继续遍历该文件，因为另一个规则可能会否定之前的效果（规则按顺序处理，因此如果你想排除 `*.c` 但不想排除 `generator.c`，一般规则必须在特定规则之前）。但是，只要在一个文件中至少有一个规则匹配，我们就丢弃剩余的文件，因为更一般的文件永远不会取消更具体的文件的效果（这就是为什么 `check_ignore1` 是三元的而不是布尔的原因）。

```python
def check_ignore_scoped(rules, path):
    parent = os.path.dirname(path)
    while True:
        if parent in rules:
            result = check_ignore1(rules[parent], path)
            if result is not None:
                return result
        if parent == "":
            break
        parent = os.path.dirname(parent)
    return None
```

一个更简单的函数用于与绝对规则列表进行匹配。注意，我们将这些规则推送到列表中的顺序很重要（我们*确实*先读取了仓库规则，然后才是全局规则！）。

```python
def check_ignore_absolute(rules, path):
    parent = os.path.dirname(path)
    for ruleset in rules:
        result = check_ignore1(ruleset, path)
        if result is not None:
            return result
    return False  # 这在此时是一个合理的默认值。
```

最后，定义一个函数将它们绑定在一起。

```python
def check_ignore(rules, path):
    if os.path.isabs(path):
        raise Exception("此函数要求路径相对于仓库的根目录")

    result = check_ignore_scoped(rules.scoped, path)
    if result is not None:
        return result

    return check_ignore_absolute(rules.absolute, path)
```

现在你可以调用 `wyag check-ignore`。在它自己的源树中：

```example
$ wyag check-ignore hello.el hello.elc hello.html wyag.zip wyag.tar
hello.elc
hello.html
wyag.zip
```

**这只是一个近似实现**

这并不是一个完美的重新实现。特别是，通过仅使用目录名称的规则（例如 `__pycache__`）来排除整个目录将不起作用，因为 `fnmatch` 需要模式为 `__pycache__/**`。如果你真的想玩弄忽略规则，[这可能是一个不错的起点](https://github.com/mherrmann/gitignore_parser)。

### 8.5. 状态命令

`status` 比 `ls-files` 更复杂，因为它需要将索引与 `HEAD` 和实际文件系统进行比较。你调用 `git status` 来知道自上一个提交以来哪些文件被添加、删除或修改，以及这些更改中哪些实际上是已暂存的，并将包含在下一个提交中。因此，`status` 实际上比较 `HEAD` 与暂存区，以及暂存区与工作树之间的差异。它的输出看起来像这样：

```example
在分支 master 上

待提交的更改：
  （使用 "git restore --staged <file>..." 来取消暂存）
    修改：   write-yourself-a-git.org

未暂存的更改：
  （使用 "git add <file>..." 来更新将要提交的内容）
  （使用 "git restore <file>..." 来放弃工作目录中的更改）
    修改：   write-yourself-a-git.org

未跟踪的文件：
  （使用 "git add <file>..." 将其包含在将要提交的内容中）
    org-html-themes/
    wl-copy
```

我们将 `status` 实现分为三个部分：首先是活动分支或“分离的 HEAD”，然后是索引与工作树之间的差异（“未暂存的更改”），最后是 `HEAD` 与索引之间的差异（“待提交的更改”和“未跟踪的文件”）。

公共接口非常简单，我们的状态命令不接受任何参数：

```python
argsp = argsubparsers.add_parser("status", help = "显示工作树状态。")
```

桥接函数按顺序调用三个组件函数：

```python
def cmd_status(_):
    repo = repo_find()
    index = index_read(repo)

    cmd_status_branch(repo)
    cmd_status_head_index(repo, index)
    print()
    cmd_status_index_worktree(repo, index)
```

#### 8.5.1. 查找活动分支

首先，我们需要知道我们是否在一个分支上，如果是的话是哪一个。我们通过查看 `.git/HEAD` 来实现。它应该包含一个十六进制 ID（指向一个提交，表示分离的 HEAD 状态），或者一个指向 `refs/heads/` 中某个内容的间接引用：即活动分支。我们返回其名称或 `False`。

```python
def branch_get_active(repo):
    with open(repo_file(repo, "HEAD"), "r") as f:
        head = f.read()

    if head.startswith("ref: refs/heads/"):
        return(head[16:-1])
    else:
        return False
```

基于此，我们可以编写桥接调用的三个 `cmd_status_*` 函数中的第一个。这个函数打印活动分支的名称，或者分离 HEAD 的哈希值：

```python
def cmd_status_branch(repo):
    branch = branch_get_active(repo)
    if branch:
        print("在分支 {} 上。".format(branch))
    else:
        print("HEAD 在 {} 上分离".format(object_find(repo, "HEAD")))
```

#### 8.5.2. 查找 HEAD 和索引之间的变化

状态输出的第二部分是“待提交的更改”，即暂存区与 HEAD 的不同之处。为此，我们首先需要读取 `HEAD` 树，并将其展平为一个包含完整路径作为键的字典（哈希映射），这样它就更接近于将路径与 blob 关联的（扁平）索引。然后我们只需比较它们并输出它们的差异。

首先，编写一个将树（递归的，记住）转换为（扁平的）字典的函数。由于树是递归的，因此该函数本身也是递归的——对此表示歉意 :)

```python
def tree_to_dict(repo, ref, prefix=""):
  ret = dict()
  tree_sha = object_find(repo, ref, fmt=b"tree")
  tree = object_read(repo, tree_sha)

  for leaf in tree.items:
      full_path = os.path.join(prefix, leaf.path)

      # 我们读取对象以提取其类型（这无谓地昂贵：我们可以直接将其作为文件打开并读取前几个字节）
      is_subtree = leaf.mode.startswith(b'04')

      # 根据类型，我们要么存储路径（如果是 blob，表示常规文件），要么递归（如果是另一个树，表示子目录）
      if is_subtree:
        ret.update(tree_to_dict(repo, leaf.sha, full_path))
      else:
        ret[full_path] = leaf.sha

  return ret
```

接下来是命令本身：

```python
def cmd_status_head_index(repo, index):
    print("待提交的更改：")

    head = tree_to_dict(repo, "HEAD")
    for entry in index.entries:
        if entry.name in head:
            if head[entry.name] != entry.sha:
                print("  修改了：", entry.name)
            del head[entry.name]  # 删除该键
        else:
            print("  添加了：", entry.name)

    # 仍在 HEAD 中的键是我们在索引中未遇到的文件，因此这些文件已被删除。
    for entry in head.keys():
        print("  已删除：", entry)
```

#### 8.5.3. 查找索引与工作树之间的变化

```python
def cmd_status_index_worktree(repo, index):
    print("未暂存的更改：")

    ignore = gitignore_read(repo)

    gitdir_prefix = repo.gitdir + os.path.sep

    all_files = list()

    # 我们首先遍历文件系统
    for (root, _, files) in os.walk(repo.worktree, True):
        if root == repo.gitdir or root.startswith(gitdir_prefix):
            continue
        for f in files:
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, repo.worktree)
            all_files.append(rel_path)

    # 现在我们遍历索引，并比较真实文件与缓存版本。

    for entry in index.entries:
        full_path = os.path.join(repo.worktree, entry.name)

        # 该文件名在索引中

        if not os.path.exists(full_path):
            print("  已删除：", entry.name)
        else:
            stat = os.stat(full_path)

            # 比较元数据
            ctime_ns = entry.ctime[0] * 10**9 + entry.ctime[1]
            mtime_ns = entry.mtime[0] * 10**9 + entry.mtime[1]
            if (stat.st_ctime_ns != ctime_ns) or (stat.st_mtime_ns != mtime_ns):
                # 如果不同，进行深度比较。
                # @FIXME 如果是指向目录的符号链接，这将崩溃。
                with open(full_path, "rb") as fd:
                    new_sha = object_hash(fd, b"blob", None)
                    # 如果哈希相同，文件实际上是相同的。
                    same = entry.sha == new_sha

                    if not same:
                        print("  修改了：", entry.name)

        if entry.name in all_files:
            all_files.remove(entry.name)

    print()
    print("未跟踪的文件：")

    for f in all_files:
        # @TODO 如果整个目录未跟踪，我们应该仅显示其名称而不包含内容。
        if not check_ignore(ignore, f):
            print(" ", f)
```

我们的状态函数完成了。它的输出应该类似于：

```example
$ wyag status
在分支 main 上。
待提交的更改：
  添加了：src/main.c

未暂存的更改：
  修改了：build.py
  已删除：README.org

未跟踪的文件：
  src/cli.c
```

真实的 `status` 更加智能：例如，它可以检测重命名，而我们的版本则无法。还有一个显著的区别值得提及的是，`git status` 实际上会在文件元数据被修改但内容未被修改时，*写回* 索引。您可以通过我们的特殊 `ls-files` 查看这一点：

```example
$ wyag ls-files --verbose
索引文件格式 v2，包含 1 个条目。
file
  普通文件，权限：644
  对应的 blob: f2f279981ce01b095c42ee7162aadf60185c8f67
  创建时间：2023-07-18 18:26:15.771460869，修改时间：2023-07-18 18:26:15.771460869
  ...
$ touch file
$ git status > /dev/null
$ wyag ls-files --verbose
索引文件格式 v2，包含 1 个条目。
file
  普通文件，权限：644
  对应的 blob: f2f279981ce01b095c42ee7162aadf60185c8f67
  创建时间：2023-07-18 18:26:41.421743098，修改时间：2023-07-18 18:26:41.421743098
  ...
```

注意，*索引文件*中的两个时间戳都被 `git status` 更新，以反映真实文件元数据的变化。

## 9\. 暂存区和索引，第二部分：暂存和提交

好的。让我们来创建提交。

我们几乎具备了所有需要的条件，除了最后三个要点：

1.  我们需要命令来修改索引，以便我们的提交不仅仅是父提交的副本。这些命令是 `add` 和 `rm`。
2.  这些命令需要将修改后的索引写回，因为我们是从索引中提交的。
3.  显然，我们还需要 `commit` 函数及其相关的 `wyag commit` 命令。

### 9.1. 写入索引

我们将首先写入索引。大致上，我们只是将所有内容序列化回二进制。这有点繁琐，但代码应该是直接明了的。我会将一些细节留给注释，但实际上这只是 `index_read` 的反向操作——如有需要，请参考它和 `GitIndexEntry` 类。

```python
def index_write(repo, index):
    with open(repo_file(repo, "index"), "wb") as f:

        # 头部

        # 写入魔术字节。
        f.write(b"DIRC")
        # 写入版本号。
        f.write(index.version.to_bytes(4, "big"))
        # 写入条目数量。
        f.write(len(index.entries).to_bytes(4, "big"))

        # 条目

        idx = 0
        for e in index.entries:
            f.write(e.ctime[0].to_bytes(4, "big"))
            f.write(e.ctime[1].to_bytes(4, "big"))
            f.write(e.mtime[0].to_bytes(4, "big"))
            f.write(e.mtime[1].to_bytes(4, "big"))
            f.write(e.dev.to_bytes(4, "big"))
            f.write(e.ino.to_bytes(4, "big"))

            # 模式
            mode = (e.mode_type << 12) | e.mode_perms
            f.write(mode.to_bytes(4, "big"))

            f.write(e.uid.to_bytes(4, "big"))
            f.write(e.gid.to_bytes(4, "big"))

            f.write(e.fsize.to_bytes(4, "big"))
            # @FIXME 转换回整数。
            f.write(int(e.sha, 16).to_bytes(20, "big"))

            flag_assume_valid = 0x1 << 15 if e.flag_assume_valid else 0

            name_bytes = e.name.encode("utf8")
            bytes_len = len(name_bytes)
            if bytes_len >= 0xFFF:
                name_length = 0xFFF
            else:
                name_length = bytes_len

            # 我们将三个数据片段（两个标志和名称长度）合并到同两个字节中。
            f.write((flag_assume_valid | e.flag_stage | name_length).to_bytes(2, "big"))

            # 写入名称和最后的 0x00。
            f.write(name_bytes)
            f.write((0).to_bytes(1, "big"))

            idx += 62 + len(name_bytes) + 1

            # 如有必要，添加填充。
            if idx % 8 != 0:
                pad = 8 - (idx % 8)
                f.write((0).to_bytes(pad, "big"))
                idx += pad
```

### 9.2. rm 命令

对索引进行的最简单修改是从中移除一个条目，这意味着下一个提交**将不包括**该文件。这就是 `git rm` 命令的作用。

`git rm` 是**破坏性的**，`wyag rm` 也是如此。该命令不仅修改索引，还会从工作区中删除文件。与 git 不同，`wyag rm` 不关心它移除的文件是否已保存。请谨慎操作。

`rm` 接受一个参数，即要移除的路径列表：

```python
argsp = argsubparsers.add_parser("rm", help="从工作树和索引中移除文件。")
argsp.add_argument("path", nargs="+", help="要移除的文件")

def cmd_rm(args):
  repo = repo_find()
  rm(repo, args.path)
```

`rm` 函数稍微长一些，但它非常简单。它接受一个仓库和一个路径列表，读取该仓库的索引，并移除与该列表匹配的索引条目。可选参数控制函数是否实际删除文件，以及如果某些路径在索引中不存在，是否应中止操作（这两个参数用于 `add`，在 `wyag rm` 命令中不暴露）。

```python
def rm(repo, paths, delete=True, skip_missing=False):
  # 查找并读取索引
  index = index_read(repo)

  worktree = repo.worktree + os.sep

  # 将路径转换为绝对路径
  abspaths = list()
  for path in paths:
    abspath = os.path.abspath(path)
    if abspath.startswith(worktree):
      abspaths.append(abspath)
    else:
      raise Exception("无法移除工作树外的路径：{}".format(paths))

  kept_entries = list()
  remove = list()

  for e in index.entries:
    full_path = os.path.join(repo.worktree, e.name)

    if full_path in abspaths:
      remove.append(full_path)
      abspaths.remove(full_path)
    else:
      kept_entries.append(e) # 保留条目

  if len(abspaths) > 0 and not skip_missing:
    raise Exception("无法移除索引中不存在的路径：{}".format(abspaths))

  if delete:
    for path in remove:
      os.unlink(path)

  index.entries = kept_entries
  index_write(repo, index)
```

现在我们可以使用 `wyag rm` 删除文件。

### 9.3. add 命令

添加操作比移除操作稍微复杂一些，但没有什么是我们不熟悉的。将文件添加到暂存区是一个三步操作：

1. 首先，如果已有索引条目，则移除该条目，但不删除文件本身（这就是我们刚刚编写的 `rm` 函数包含可选参数的原因）。
2. 然后对文件进行哈希处理，生成一个 blob 对象。
3. 创建该条目。
4. 最后，当然要将修改后的索引写回。

首先是接口。没有什么惊喜，`wyag add PATH ...`，其中 PATH 是一个或多个要暂存的文件。桥接函数非常简单。

```python
argsp = argsubparsers.add_parser("add", help="将文件内容添加到索引。")
argsp.add_argument("path", nargs="+", help="要添加的文件")

def cmd_add(args):
  repo = repo_find()
  add(repo, args.path)
```

与 `rm` 的主要区别在于 `add` 需要创建一个索引条目。这并不难：我们只需对文件进行 `stat()` 操作，并将元数据复制到索引的字段中（`stat()` 返回索引存储的元数据：创建/修改时间等）。

```python
def add(repo, paths, delete=True, skip_missing=False):

  # 首先从索引中移除所有路径（如果存在）。
  rm(repo, paths, delete=False, skip_missing=True)

  worktree = repo.worktree + os.sep

  # 将路径转换为对： （绝对路径，相对工作树路径）。
  # 如果它们在索引中，则也将其删除。
  clean_paths = list()
  for path in paths:
    abspath = os.path.abspath(path)
    if not (abspath.startswith(worktree) and os.path.isfile(abspath)):
      raise Exception("不是文件，或不在工作树内：{}".format(paths))
    relpath = os.path.relpath(abspath, repo.worktree)
    clean_paths.append((abspath, relpath))

    # 查找并读取索引。它已被 rm 修改。（这不是最优的，但对 wyag 足够了！）
    #
    # @FIXME: 我们本可以通过命令移动索引，而不是读取和重新写入它。
    index = index_read(repo)

    for (abspath, relpath) in clean_paths:
      with open(abspath, "rb") as fd:
        sha = object_hash(fd, b"blob", repo)

      stat = os.stat(abspath)

      ctime_s = int(stat.st_ctime)
      ctime_ns = stat.st_ctime_ns % 10**9
      mtime_s = int(stat.st_mtime)
      mtime_ns = stat.st_mtime_ns % 10**9

      entry = GitIndexEntry(ctime=(ctime_s, ctime_ns), mtime=(mtime_s, mtime_ns), dev=stat.st_dev, ino=stat.st_ino,
                            mode_type=0b1000, mode_perms=0o644, uid=stat.st_uid, gid=stat.st_gid,
                            fsize=stat.st_size, sha=sha, flag_assume_valid=False,
                            flag_stage=False, name=relpath)
      index.entries.append(entry)

    # 将索引写回
    index_write(repo, index)
```

### 9.4. commit 命令

现在我们已经修改了索引，也就是实际的 *暂存更改*，我们只需要将这些更改转换为一个提交。这就是 `commit` 的作用。

```python
argsp = argsubparsers.add_parser("commit", help="记录对仓库的更改。")

argsp.add_argument("-m",
                   metavar="message",
                   dest="message",
                   help="与此提交关联的消息。")
```

为此，我们首先需要将索引转换为树对象，生成并存储相应的提交对象，并将 HEAD 分支更新为新的提交（请记住：分支只是指向提交的引用）。

在进入有趣的细节之前，我们需要读取 Git 的配置，以获取用户的名字，作为作者和提交者。我们将使用之前用来读取仓库配置的 `configparser` 库。

```python
def gitconfig_read():
    xdg_config_home = os.environ["XDG_CONFIG_HOME"] if "XDG_CONFIG_HOME" in os.environ else "~/.config"
    configfiles = [
        os.path.expanduser(os.path.join(xdg_config_home, "git/config")),
        os.path.expanduser("~/.gitconfig")
    ]

    config = configparser.ConfigParser()
    config.read(configfiles)
    return config
```

接下来是一个简单的函数，用于获取并格式化用户身份：

```python
def gitconfig_user_get(config):
    if "user" in config:
        if "name" in config["user"] and "email" in config["user"]:
            return "{} <{}>".format(config["user"]["name"], config["user"]["email"])
    return None
```

现在进入有趣的部分。我们首先需要从索引构建一棵树。这并不困难，但请注意，虽然索引是平面的（它为整个工作树存储完整路径），而树是一个递归结构：它列出文件或其他树。为了将索引“反扁平化”为一棵树，我们将：

1. 建立一个目录的字典（哈希映射）。键是来自工作树根的完整路径（如 `assets/sprites/monsters/`），值是 `GitIndexEntry` 的列表——该目录中的文件。此时，我们的字典仅包含 *文件*：目录仅作为其键。
2. 遍历此列表，从最深的目录向上到根（深度实际上并不重要：我们只希望在看到每个目录的 *父目录* 之前看到它。为此，我们只需按 *完整* 路径长度从长到短对它们进行排序——父目录显然总是较短的）。例如，想象我们从 `assets/sprites/monsters/` 开始。
3. 在每个目录下，我们使用其内容构建一棵树，比如 `cacodemon.png`、`imp.png` 和 `baron-of-hell.png`。
4. 将新树写入仓库。
5. 然后将此树添加到该目录的父目录中。这意味着此时，`assets/sprites/` 现在包含我们新树对象的 SHA-1 ID，名称为 `monsters`。
6. 接着我们迭代下一个目录，比如 `assets/sprites/keys`，在这里我们发现 `red.png`、`blue.png` 和 `yellow.png`，创建一棵树，存储该树，并在 `assets/sprites/` 下以名称 `keys` 添加该树的 SHA-1，依此类推。

由于树是递归的？因此我们构建的最后一棵树必然是根树（因为它的键长度为 0），最终将引用所有其他树，因此它将是我们唯一需要的树。我们只需返回其 SHA-1，就完成了。

由于这可能看起来有些复杂，让我们详细演示这个例子——随意跳过。在开始时，我们从索引构建的字典如下所示：

```example
contents["assets/sprites/monsters"] =
  [ cacodemon.png : GitIndexEntry
  , imp.png : GitIndexEntry
  , baron-of-hell.png : GitIndexEntry ]
contents["assets/sprites/keys"] =
  [ red.png : GitIndexEntry
  , blue.png : GitIndexEntry
  , yellow.png : GitIndexEntry ]
contents["assets/sprites/"] =
  [ hero.png : GitIndexEntry ]
contents["assets/"] = [] # 这里没有文件
contents[""] = # 根！
  [ README: GitIndexEntry ]
```

我们按键长度从长到短的顺序进行迭代。我们遇到的第一个键是最长的，即 `assets/sprites/monsters`。我们根据其内容构建一个新的树对象，将三个文件名（`cacodemon.png`、`imp.png`、`baron-of-hell.png`）与它们对应的 blob 关联起来（树的叶子存储的数据 *比* 索引少——仅存储路径、模式和 blob。因此，以这种方式转换条目是容易的）。

注意，我们不需要关心存储这些文件的 **内容**：`wyag add` 确实根据需要创建了相应的 blob。我们需要将我们创建的 *树* 存储到对象库中，但我们可以假设 blob 已经在那里。

假设我们新生成的树哈希值，由直接来自 `assets/sprites/monsters` 的索引条目生成，哈希值为 `426f894781bc3c38f1d26f8fd2c7f38ab8d21763`。我们 **修改我们的字典**，将这个新的树对象添加到目录的父级，像这样，所以现在剩下的遍历内容看起来是这样的：

```example
contents["assets/sprites/keys"] = # <- 未修改。
  [ red.png : GitIndexEntry
  , blue.png : GitIndexEntry
  , yellow.png : GitIndexEntry ]
contents["assets/sprites/"] =
  [ hero.png : GitIndexEntry
  , monsters : Tree 426f894781bc3c38f1d26f8fd2c7f38ab8d21763 ] <- 看这里
contents["assets/"] = [] # 空
contents[""] = # 根！
  [ README: GitIndexEntry ]
```

我们对下一个最长的键 `assets/sprites/keys` 做同样的操作，生成一个哈希为 `b42788e087b1e94a0e69dcb7a4a243eaab802bb2` 的树，因此：

```example
contents["assets/sprites/"] =
  [ hero.png : GitIndexEntry
  , monsters : Tree 426f894781bc3c38f1d26f8fd2c7f38ab8d21763
  , keys : Tree b42788e087b1e94a0e69dcb7a4a243eaab802bb2 ]
contents["assets/"] = [] # 空
contents[""] = # 根！
  [ README: GitIndexEntry ]
```

接着，我们从 `assets/sprites` 生成哈希为 `6364113557ed681d775ccbd3c90895ed276956a2` 的树，它现在包含我们的两个树和 `hero.png`。

```example
contents["assets/"] = [
  sprites: Tree 6364113557ed681d775ccbd3c90895ed276956a2 ]
contents[""] = # 根！
  [ README: GitIndexEntry ]
```

`assets` 反过来变成哈希为 `4d35513cb6d2a816bc00505be926624440ebbddd` 的树，因此：

```example
contents[""] = # 根！
  [ README: GitIndexEntry,
    assets: 4d35513cb6d2a816bc00505be926624440ebbddd]
```

我们从最后一个键（带有 `README` blob 和 `assets` 子树）生成一棵树，它的哈希值为 `9352e52ff58fa9bf5a750f090af64c09fa6a3d93`。这就是我们的返回值：这棵树的内容与索引的内容相同。

这里是实际的函数：

```python
def tree_from_index(repo, index):
    contents = dict()
    contents[""] = list()

    # 枚举条目，并将它们转换为一个字典，其中键是目录，值是目录内容的列表。
    for entry in index.entries:
        dirname = os.path.dirname(entry.name)

        # 我们创建所有到根目录 ("") 的字典条目。我们需要它们 *全部*，因为即使一个目录没有文件，它至少会包含一个树。
        key = dirname
        while key != "":
            if key not in contents:
                contents[key] = list()
            key = os.path.dirname(key)

        # 暂时将条目存储在列表中。
        contents[dirname].append(entry)

    # 获取键（即目录）并按长度降序排序。
    # 这意味着我们总是会在其父目录之前遇到给定路径，这正是我们需要的，因为对于每个目录 D，我们需要修改其父目录 P 以添加 D 的树。
    sorted_paths = sorted(contents.keys(), key=len, reverse=True)

    # 这个变量将存储当前树的 SHA-1。完成遍历后，它将包含根树的哈希。
    sha = None

    # 我们遍历排序后的路径列表（字典键）
    for path in sorted_paths:
        # 准备一个新的空树对象
        tree = GitTree()

        # 将每个条目依次添加到我们的新树中
        for entry in contents[path]:
            # 条目可以是从索引读取的普通 GitIndexEntry，或者是我们创建的树。
            if isinstance(entry, GitIndexEntry):  # 普通条目（一个文件）

                # 我们转换模式：条目将其存储为整数，我们需要树的八进制 ASCII 表示。
                leaf_mode = "{:02o}{:04o}".format(entry.mode_type, entry.mode_perms).encode("ascii")
                leaf = GitTreeLeaf(mode=leaf_mode, path=os.path.basename(entry.name), sha=entry.sha)
            else:  # 树。我们将其存储为一对： (basename, SHA)
                leaf = GitTreeLeaf(mode=b"040000", path=entry[0], sha=entry[1])

            tree.items.append(leaf)

        # 将新的树对象写入存储。
        sha = object_write(tree, repo)

        # 将新的树哈希添加到当前字典的父目录，作为一对 (basename, SHA)
        parent = os.path.dirname(path)
        base = os.path.basename(path)  # 不带路径的名称，例如 src/main.go 的 main.go
        contents[parent].append((base, sha))

    return sha
```

这部分比较复杂；我希望它足够清晰。从这里开始，创建提交对象和更新 HEAD 将会简单得多。只需记住，这个函数 *做* 的事情是构建和存储尽可能多的树对象，以表示索引，并返回根树的 SHA-1。

创建提交对象的函数足够简单，它只接受一些参数：树的哈希、父提交的哈希、作者的身份（一个字符串）、时间戳和时区差值，以及消息：

```python
def commit_create(repo, tree, parent, author, timestamp, message):
    commit = GitCommit()  # 创建新的提交对象
    commit.kvlm[b"tree"] = tree.encode("ascii")
    if parent:
        commit.kvlm[b"parent"] = parent.encode("ascii")

    # 格式化时区
    offset = int(timestamp.astimezone().utcoffset().total_seconds())
    hours = offset // 3600
    minutes = (offset % 3600) // 60
    tz = "{}{:02}{:02}".format("+" if offset > 0 else "-", hours, minutes)

    author = author + timestamp.strftime(" %s ") + tz

    commit.kvlm[b"author"] = author.encode("utf8")
    commit.kvlm[b"committer"] = author.encode("utf8")
    commit.kvlm[None] = message.encode("utf8")

    return object_write(commit, repo)
```

剩下的就是 `cmd_commit`，它是 `wyag commit` 命令的桥接函数：

```python
def cmd_commit(args):
    repo = repo_find()
    index = index_read(repo)
    # 创建树，获取根树的 SHA
    tree = tree_from_index(repo, index)

    # 创建提交对象
    commit = commit_create(repo,
                           tree,
                           object_find(repo, "HEAD"),
                           gitconfig_user_get(gitconfig_read()),
                           datetime.now(),
                           args.message)

    # 更新 HEAD，使我们的提交成为当前分支的顶端
    active_branch = branch_get_active(repo)
    if active_branch:  # 如果我们在一个分支上，更新 refs/heads/BRANCH
        with open(repo_file(repo, os.path.join("refs/heads", active_branch)), "w") as fd:
            fd.write(commit + "\n")
    else:  # 否则，更新 HEAD 本身
        with open(repo_file(repo, "HEAD"), "w") as fd:
            fd.write("\n")
```

我们完成了！

## 10. 最后的话

### 10.1. 评论、反馈和问题

此页面没有评论系统 :) 可以通过电子邮件联系我，邮箱是 <thibault@thb.lt>。我也可以在 [Mastodon 上找到，用户名是 @thblt@toad.social](https://toad.social/@thblt)，在 [Twitter 上是 @ThbPlg](https://twitter.com/ThbPlg)，偶尔在 Libera 的 IRC 上以 `thblt` 身份出现。

这篇文章的源代码托管在 [Github](https://github.com/thblt/write-yourself-a-git)。欢迎提出问题报告和拉取请求，可以直接在 GitHub 上进行，也可以通过电子邮件发送，如果你更喜欢的话。

### 10.2. 许可证

本文根据 [Creative Commons BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 的条款进行分发。该 [程序本身](./wyag.zip) 也根据 GNU 通用公共许可证 3.0 的条款进行许可，或根据你选择的同一许可证的任何较新版本进行许可。

作者：[Thibault Polge](mailto:thibault@thb.lt)

创建时间：2024-06-08 星期六 10:48

[^1]: 你可能知道 [SHA-1 中已发现碰撞](https://shattered.io/)。实际上，Git 现在不再使用 SHA-1：它使用一种 [加强版](https://github.com/git/git/blob/26e47e261e969491ad4e3b6c298450c061749c9e/Documentation/technical/hash-function-transition.txt#L34-L36)，该版本不是 SHA，但对每个已知输入应用相同的哈希，除了已知存在碰撞的两个 PDF 文件。
