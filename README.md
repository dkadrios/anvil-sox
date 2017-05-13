# ANVIL Audio Utilities

Provides library for munging input WAV files into output expected by the [ANVIL firmware](http://zendrumstudio.com/anvil/).

## Setup

### Step 1 

Obtain the source code by running the following command in Terminal. A sub-directory named `anvil-sox` will be created.

```
git clone git@bitbucket.org:nebiru/anvil-sox.git
```

### Step 2

Install [NodeJS 7.10.0](https://nodejs.org/dist/v7.10.0/node-v7.10.0.pkg)

### Step 3

Create a directory called `wav-in` beneath `anvil-sox` and place the source WAV files within.

The `wav-in` folder can be a symlink if you'd rather not copy the files into it.  Note that aliases will not work, it must be a symlink.
For example:

```
ln -s /Users/<path to wavs> wav-in
```

### Step 4

Install SoX (and Homebrew if needed)

```
ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)" < /dev/null 2> /dev/null
brew install sox
```

### Step 5

Install Gulp and prerequisites

```
sudo npm install -g gulp
npm install
```

The following command should show the available commands for this library.  If so, then setup is complete.

```
gulp
```

## Usage

### General Reporting

```
gulp report
```

This will verify the contents of `wav-in` and look for any discrepancies with the [TRS ZenEdit module file](./Zendrum%20Stompbox.txt).
It also will display a primitive histogram of 'layers per sample'.

### Building

```
gulp build
```
This is the main command.  It takes the files from `wav-in`, processes them and outputs to `wav-out`.  
The contents of `wav-out` can be copied directly to an SD card for use with the Stompbox -- no further editing is required.

The build produce 16 layers for each note #, regardless of the number of input layers.
If less than 16 are provided then copies of of them will be made.  
The available layers are always distributed linearly, with required copies filling in the blanks.
For instance, if only 5 samples were provided, titled S1, S2 ... S5, then the 16 output layers would be
 * S1
 * (copy of S1)
 * (copy of S1)
 * (copy of S1)
 * S2
 * (copy of S2)
 * (copy of S2)
 * (copy of S2)
 * S3
 * (copy of S3)
 * (copy of S3)
 * (copy of S3)
 * S4
 * (copy of S4)
 * (copy of S4)
 * S5
 
Similarly, if more than 16 were provided, then samples will be removed across the entire distribution.

Effects are processed based on the contents of [panning.txt](./panning.txt) and [reverb.txt](./reverb.txt) and each file is individually normalized.

Pan values range from -1 to 1, with zero being center.  
For example, to place a sample slightly to the left, set its pan to `-0.1`.

Reverb values should be presented as percentages, with 0 meaning 'no reverb'.

Silence is removed from the head and tail of each file, metadata is stripped and the output is
resampled to 16-bit at 44.1kHz if needed, and also split into stereo tracks if the input was mono.   This makes the files suitable for the [WAV Trigger](https://www.sparkfun.com/products/13660) 
and [ANVIL firmware](http://zendrumstudio.com/anvil/).

Note that this is a lengthy process and will take up to 5 minutes to complete. 

If you only require samples from a particular MIDI note # to be processed, you can run

```
gulp build --n 9
```
...which in this example would build note #9 (claves)

### Testing / Playing Samples

```
gulp play --n 9
```
This command will play each of the 16 layers in succession, for the given note number.

Note that for samples with long tails, this can take quite a while to complete.  Use CTRL+C to abort if needed.
